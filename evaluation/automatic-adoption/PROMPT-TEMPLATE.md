Read and follow the repository instructions at `{packet_root}/AGENTS.md` and the requested work at `{packet_root}/TASK.md`. Work only in `{packet_root}`.

For every shell operation that reads, changes, or checks files, invoke the neutral recorder below. It accepts ordinary commands and runs them in the working directory:

```sh
python3 /tmp/repository-agent-study/runner.py command --root {packet_root} --log {event_log} --max-commands 30 --timeout-seconds 120 --max-output-bytes 24000 -- bash -lc '<command>'
```

Use `max_output_tokens: 30000` for every tool invocation and `max_output_tokens: 30000` for each code-mode execution response. Do not spawn agents, use network tools, or access paths outside the working directory, except for the recorder and its log path above. Do not modify the recorder or its log.

Complete the requested work, run appropriate existing checks, and save a concise final response in `{packet_root}/ANSWER.md`. Then run:

```sh
python3 /tmp/repository-agent-study/runner.py finish --root {packet_root} --log {event_log}
```
