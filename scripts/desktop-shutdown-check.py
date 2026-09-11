"""Linux/WSL regression check for private desktop cleanup on launcher signals."""
import json
from pathlib import Path
import signal
import subprocess
import time

root = Path(__file__).resolve().parents[1]
results = []
for sig in [signal.SIGHUP, signal.SIGTERM]:
    helper = subprocess.Popen(
        ["python3", str(root / "scripts/desktop-session.py")],
        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        text=True)
    try:
        info = json.loads(helper.stdout.readline())
        owned = [int(s) for s in subprocess.check_output(
            ["pgrep", "-P", str(helper.pid)], text=True).split()]
        started = time.monotonic()
        helper.send_signal(sig)
        helper.wait(timeout=15)
        remaining = [pid for pid in owned if Path(f"/proc/{pid}").exists()]
        results.append({"signal": sig.name, "remainingChildren": remaining,
                        "elapsedMs": round((time.monotonic()-started)*1000)})
        assert not remaining, f"Orphaned owned children: {remaining}"
    finally:
        if helper.poll() is None:
            helper.stdin.close()
            helper.wait(timeout=15)
print(json.dumps(results, indent=2))
