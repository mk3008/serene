"""Mediated controller for the covered-site triage study.

The study runner supplies its complete navigation index.  This module deliberately
does not discover execution sites or derive dependency ranges from source.
"""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import sys
import threading
import time


DEFAULT_BUDGET = {"bytes": 32768, "requests": 80, "seconds": 600}


class Run:
 def __init__(self, config, resume=False):
  self.config = config
  self.root = Path(config["root"]).resolve()
  self.log = Path(config["log"])
  self.started = None
  self.events = []
  self.bytes = 0
  self.deep = set()
  self.exposed = {}
  self.closed = False
  self.lock = threading.Lock()
  if not resume and self.log.exists():
   raise AssertionError("log already exists")
  self.log.parent.mkdir(parents=True, exist_ok=True)
  self.budget = dict(DEFAULT_BUDGET)
  self.budget.update(config.get("budget", {}))
  for key in DEFAULT_BUDGET:
   if type(self.budget[key]) is not int or self.budget[key] < 0:
    raise ValueError("invalid budget " + key)

  self.functions = self._normalise_functions(config.get("functions", {}))
  self.sites = self._normalise_sites(config.get("sites", []))
  self.paths = set(self.functions)
  for site in self.sites:
   self.paths.add(site["path"])
   self.paths.update(span["path"] for span in site["dependency_spans"])
  self.sources = {path: self._read_source(path) for path in self.paths}

 def _read_source(self, path):
  if not isinstance(path, str) or not path or Path(path).is_absolute():
   raise ValueError("invalid source path")
  candidate = (self.root / path).resolve()
  try:
   candidate.relative_to(self.root)
  except ValueError as error:
   raise ValueError("invalid source path") from error
  if not candidate.is_file():
   raise ValueError("configured source path is missing: " + path)
  return candidate.read_text()

 def _range(self, value, label):
  if isinstance(value, dict):
   start, end = value.get("start"), value.get("end")
  elif isinstance(value, (list, tuple)) and len(value) == 2:
   start, end = value
  else:
   raise ValueError("invalid " + label + " range")
  if type(start) is not int or type(end) is not int or start < 1 or end < start:
   raise ValueError("invalid " + label + " range")
  return {"start": start, "end": end}

 def _normalise_functions(self, functions):
  if not isinstance(functions, dict):
   raise ValueError("functions must be an object")
  result = {}
  for path, entries in functions.items():
   if not isinstance(path, str) or not isinstance(entries, dict):
    raise ValueError("invalid functions index")
   result[path] = {}
   for name, span in entries.items():
    if not isinstance(name, str) or not name:
     raise ValueError("invalid function name")
    result[path][name] = self._range(span, "function")
  return result

 def _normalise_sites(self, sites):
  if not isinstance(sites, list):
   raise ValueError("sites must be a list")
  result = []
  ids = set()
  for raw in sites:
   if not isinstance(raw, dict):
    raise ValueError("invalid site")
   required = {"id", "path", "function", "start", "end", "line", "dependency_spans"}
   if not required.issubset(raw):
    raise ValueError("incomplete site")
   if any(not isinstance(raw[key], str) or not raw[key] for key in ("id", "path", "function")):
    raise ValueError("invalid site")
   if raw["id"] in ids or type(raw["line"]) is not int or raw["line"] < 1:
    raise ValueError("invalid site")
   site_range = self._range({"start": raw["start"], "end": raw["end"]}, "site")
   deps = raw["dependency_spans"]
   if not isinstance(deps, list):
    raise ValueError("invalid dependency spans")
   spans = []
   for dependency in deps:
    if not isinstance(dependency, dict) or not isinstance(dependency.get("path"), str):
     raise ValueError("invalid dependency span")
    span = self._range(dependency, "dependency")
    spans.append({"path": dependency["path"], **span})
   ids.add(raw["id"])
   result.append({"id": raw["id"], "path": raw["path"], "function": raw["function"],
                  "line": raw["line"], **site_range, "dependency_spans": spans})
  return result

 def handle(self, query):
  with self.lock:
   return self._handle(query)

 def _validate_keys(self, query, allowed):
  unknown = set(query) - allowed
  if unknown:
   raise ValueError("unexpected arguments: " + ", ".join(sorted(unknown)))

 def _source(self, path, start, end):
  lines = self.sources[path].splitlines()
  if end > len(lines):
   raise ValueError("range exceeds source")
  delivered = [(path, line) for line in range(start, end + 1)]
  text = "\n".join(f"{line}: {lines[line - 1]}" for line in range(start, end + 1))
  return {"path": path, "text": text}, delivered

 def _function_request(self, query, investigate):
  allowed = {"op", "path", "function", "line"}
  self._validate_keys(query, allowed)
  path = query.get("path")
  if not isinstance(path, str) or path not in self.functions:
   raise ValueError("unknown function path")
  has_function = "function" in query
  has_line = "line" in query
  if has_function == has_line:
   raise ValueError("provide exactly one of function or line")
  if has_function:
   name = query["function"]
   if not isinstance(name, str) or name not in self.functions[path]:
    raise ValueError("unknown function")
  else:
   line = query["line"]
   if type(line) is not int:
    raise ValueError("line must be an integer")
   name = next((candidate for candidate, span in self.functions[path].items()
                if span["start"] <= line <= span["end"]), None)
   if name is None:
    raise ValueError("unknown function or source line")
  span = self.functions[path][name]
  ranges = [(path, span["start"], span["end"])]
  newdeep = set()
  if investigate:
   for site in self.sites:
    if site["path"] == path and site["function"] == name:
     newdeep.add(site["id"])
     ranges.extend((dependency["path"], dependency["start"], dependency["end"])
                   for dependency in site["dependency_spans"])
  # Keep the selected range first and do not duplicate a supplied dependency span.
  unique = []
  for item in ranges:
   if item not in unique:
    unique.append(item)
  sources, exposure = [], []
  for range_path, start, end in unique:
   source, lines = self._source(range_path, start, end)
   sources.append(source)
   exposure.extend(lines)
  return {"sources": sources}, exposure, newdeep

 def _handle(self, query):
  if self.started is None:
   self.started = time.time()
  before = time.time()
  sequence = len(self.events) + 1
  exposure = []
  newdeep = set()
  try:
   if not isinstance(query, dict):
    raise ValueError("request must be an object")
   op = query.get("op")
   if self.closed:
    raise ValueError("closed")
   # finish is the one terminal acknowledgement allowed after another cap is hit.
   if op != "finish":
    if sequence > self.budget["requests"] or before - self.started >= self.budget["seconds"]:
     raise ValueError("request/time cap")
   if op == "sites":
    self._validate_keys(query, {"op"})
    payload = {"sites": [{key: site[key] for key in ("id", "path", "function", "line")}
                         for site in self.sites]}
   elif op == "audit":
    self._validate_keys(query, {"op"})
    report = self.config.get("audit_report")
    if report is None:
     raise ValueError("audit unavailable")
    payload = report
   elif op == "read":
    self._validate_keys(query, {"op", "path", "start", "end"})
    path = query.get("path")
    if not isinstance(path, str) or path not in self.sources:
     raise ValueError("unknown path")
    line_count = len(self.sources[path].splitlines())
    start, end = query.get("start", 1), query.get("end", line_count)
    if type(start) is not int or type(end) is not int or start < 1 or end < start:
     raise ValueError("invalid range")
    source, exposure = self._source(path, start, end)
    payload = {"sources": [source]}
   elif op == "function":
    payload, exposure, newdeep = self._function_request(query, False)
   elif op == "investigate":
    payload, exposure, newdeep = self._function_request(query, True)
   elif op == "finding":
    self._validate_keys(query, {"op", "path", "function", "mechanism", "impact"})
    if not all(isinstance(query.get(key), str) and query[key] for key in
               ("path", "function", "mechanism", "impact")):
     raise ValueError("path, function, mechanism and impact are required")
    if query["path"] not in self.functions or query["function"] not in self.functions[query["path"]]:
     raise ValueError("unknown finding function")
    payload = {"recorded": True, "correctness": "adjudicated later"}
   elif op == "status":
    self._validate_keys(query, {"op"})
    payload = {"requests": len(self.events), "bytes": self.bytes,
               "deep_sites": len(self.deep), "seconds": before - self.started}
   elif op == "finish":
    self._validate_keys(query, {"op"})
    payload = {"finished": True}
   else:
    raise ValueError("unknown op")

   if (op != "finish" and "deep_sites" in self.budget
       and len(self.deep | newdeep) > self.budget["deep_sites"]):
    raise ValueError("dependency-expanded site cap; content withheld")
   response = {"ok": True, "result": payload}
   size = len((json.dumps(response) + "\n").encode())
   if op != "finish" and self.bytes + size > self.budget["bytes"]:
    raise ValueError("byte cap; content withheld")
   if op != "finish" and time.time() - self.started >= self.budget["seconds"]:
    raise ValueError("time cap; content withheld")
   self.bytes += size
   self.deep |= newdeep
   for path, line in exposure:
    self.exposed.setdefault(path, set()).add(line)
   if op == "finish":
    self.closed = True
  except Exception as error:
   response = {"ok": False, "error": str(error)}
   exposure = []
   self.bytes += len((json.dumps(response) + "\n").encode())
  event = {"sequence": sequence, "request": query, "response": response,
           "elapsed_seconds": time.time() - self.started,
           "tool_seconds": time.time() - before, "returned_bytes": self.bytes,
           "deep_site_count": len(self.deep), "deep_sites": sorted(self.deep),
           "source_lines_delivered": exposure}
  self.events.append(event)
  with self.log.open("a") as handle:
   handle.write(json.dumps(event) + "\n")
  return response


class Handler(BaseHTTPRequestHandler):
 def do_POST(self):
  try:
   name = self.path.strip("/")
   query = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
   result = runs[name].handle(query)
   body = json.dumps(result).encode()
   self.send_response(200)
  except Exception as error:
   body = json.dumps({"ok": False, "error": str(error)}).encode()
   self.send_response(400)
  self.end_headers()
  self.wfile.write(body)

 def log_message(self, *args):
  pass


if __name__ == "__main__":
 config = json.loads(Path(sys.argv[1]).read_text())
 runs = {name: Run(run_config) for name, run_config in config["runs"].items()}
 server = ThreadingHTTPServer(("127.0.0.1", config["port"]), Handler)
 print("ready", flush=True)
 server.serve_forever()
