Read and follow the repository instructions at `/tmp/repository-agent-study/r01/AGENTS.md` and the requested work at `/tmp/repository-agent-study/r01/TASK.md`. Work only in `/tmp/repository-agent-study/r01`.

For every shell operation that reads, changes, or checks files, invoke the neutral recorder below. It accepts ordinary commands and runs them in the working directory:

```sh
python3 /tmp/repository-agent-study/runner.py command --root /tmp/repository-agent-study/r01 --log /tmp/repository-agent-study/evidence/r01/events.jsonl --max-commands 30 --timeout-seconds 120 --max-output-bytes 24000 -- bash -lc '<command>'
```

Use `max_output_tokens: 30000` for every tool invocation and `max_output_tokens: 30000` for each code-mode execution response. Do not spawn agents, use network tools, or access paths outside the working directory, except for the recorder and its log path above. Do not modify the recorder or its log.

Complete the requested work, run appropriate existing checks, and save a concise final response in `/tmp/repository-agent-study/r01/ANSWER.md`. Then run:

```sh
python3 /tmp/repository-agent-study/runner.py finish --root /tmp/repository-agent-study/r01 --log /tmp/repository-agent-study/evidence/r01/events.jsonl
```
