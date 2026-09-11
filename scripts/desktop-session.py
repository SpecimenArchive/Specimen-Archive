"""Private X11 presentation session. Never captures the operator's desktop.

One process owns its Xvfb, Openbox, tint2, Chrome and loopback capture service.
stdout is a JSON handshake; terminating stdin tears down only these children.
"""
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import socket
import base64
import threading
import time
import signal
from http.server import BaseHTTPRequestHandler, HTTPServer
from PIL import ImageGrab

WIDTH, HEIGHT = 960, 540
children = []
session = tempfile.TemporaryDirectory(prefix="specimen-desktop-")
root = Path(session.name)
log = open(root / "session.log", "w")


def stop_session(signum, _frame):
    # WSL can send HUP/TERM when its Windows launcher closes. Python's defaults
    # skip finally for these signals, leaving the X server orphaned.
    raise SystemExit(128 + signum)


signal.signal(signal.SIGHUP, stop_session)
signal.signal(signal.SIGTERM, stop_session)


def launch(args, env=None):
    child = subprocess.Popen(args, env=env, stdout=log, stderr=log)
    children.append(child)
    return child


try:
    # WSLg mounts the pathname X socket directory read-only. A per-process
    # display uses Linux's abstract UNIX socket without modifying that mount.
    display = ":" + str(100 + os.getpid())
    xvfb = launch(["Xvfb", display, "-screen", "0",
                   f"{WIDTH}x{HEIGHT}x24", "-nolisten", "tcp", "-ac"])
    env = {**os.environ, "DISPLAY": display, "XDG_CONFIG_HOME": str(root / "config")}
    deadline = time.monotonic() + 8
    while subprocess.run(["xdpyinfo"], env=env, stdout=log, stderr=log).returncode:
        if xvfb.poll() is not None or time.monotonic() > deadline:
            raise RuntimeError("Xvfb failed: " + (root / "session.log").read_text()[-1500:])
        time.sleep(.05)
    subprocess.run(["xsetroot", "-solid", "#29353b"], env=env, check=True)
    wm_config = root / "openbox.xml"
    wm_config.write_text('''<openbox_config xmlns="http://openbox.org/3.4/rc"><theme><name>Onyx</name><titleLayout>NLIMC</titleLayout><font place="ActiveWindow"><name>Liberation Sans</name><size>9</size></font></theme><desktops><number>1</number></desktops></openbox_config>''')
    launch(["openbox", "--sm-disable", "--config-file", str(wm_config)], env)
    panel = root / "tint2rc"
    panel.write_text("""rounded = 0
border_width = 0
background_color = #182126 100
panel_items = TC
panel_size = 100% 28
panel_position = bottom center horizontal
panel_background_id = 1
panel_padding = 8 3 8
panel_layer = top
strut_policy = follow_size
taskbar_mode = single_desktop
taskbar_padding = 0 0 4
task_icon = 1
task_text = 1
task_maximum_size = 260 24
task_padding = 5 2 5
task_font = Liberation Sans 10
task_font_color = #c7d1d3 100
task_active_background_id = 1
time1_format = %H:%M
time1_font = Liberation Sans 10
clock_font_color = #c7d1d3 100
clock_padding = 8 0
""")
    launch(["tint2", "-c", str(panel)], env)
    profile = root / "chrome"
    # Chrome's default frame style varies with the host desktop environment.
    # Its client-drawn resize border otherwise clips the emulated page at the
    # right/bottom edges. Use the real Openbox frame on every private display.
    (profile / "Default").mkdir(parents=True)
    (profile / "Default" / "Preferences").write_text(json.dumps({
        "browser": {"custom_chrome_frame": False}
    }))
    chrome = launch(["google-chrome", "--no-first-run",
                     "--ozone-platform=x11",
                     "--no-default-browser-check", "--disable-dev-shm-usage",
                     "--disable-gpu", "--disable-session-crashed-bubble",
                     "--disable-features=Translate,MediaRouter,OptimizationHints",
                     "--remote-debugging-port=0", f"--user-data-dir={profile}",
                     "--window-position=79,16", "--window-size=640,448", "about:blank"], env)
    deadline = time.monotonic() + 20
    active = profile / "DevToolsActivePort"
    while not active.exists():
        if chrome.poll() is not None or time.monotonic() > deadline:
            raise RuntimeError("Isolated Chrome failed to start: " + (root / "session.log").read_text()[-3000:])
        time.sleep(.05)
    cdp_port = int(active.read_text().splitlines()[0])

    class Capture(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass

        def do_GET(self):
            if self.path == "/arrange":
                ids = subprocess.check_output(["xdotool", "search", "--onlyvisible", "--class", "google-chrome"], env=env).decode().split()
                window = ids[-1]
                # Native client: tabs/address bar 87 px + unchanged 360 px page.
                subprocess.run(["xdotool", "windowsize", "--sync", window, "640", "447"], env=env, check=True)
                subprocess.run(["xdotool", "windowmove", "--sync", window, "160", "40"], env=env, check=True)
                subprocess.run(["xsetroot", "-solid", "#29353b"], env=env, check=True)
                self.send_response(204)
                self.end_headers()
                return
            if self.path != "/capture":
                self.send_error(404)
                return
            started = time.time()
            # XGetImage reads this virtual root, without the unrelated native X
            # pointer. The task's one cyan pointer is driven by recorded events.
            bitmap = ImageGrab.grab(xdisplay=display)
            output = io.BytesIO()
            bitmap.save(output, format="PNG", compress_level=2)
            payload = output.getvalue()
            self.send_response(200)
            self.send_header("Content-Type", "image/png")
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("X-Captured-At", str(round(started * 1000)))
            self.send_header("X-Capture-Ms", str(round((time.time() - started) * 1000, 2)))
            self.end_headers()
            self.wfile.write(payload)

    server = HTTPServer(("127.0.0.1", 0), Capture)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    print(json.dumps({"cdpPort": cdp_port, "capturePort": server.server_port,
                      "width": WIDTH, "height": HEIGHT, "display": display}), flush=True)
    # Transport over the child process pipes, not WSL/LAN port exposure.
    peers = {}
    output_lock = threading.Lock()

    def send(message):
        with output_lock:
            print(json.dumps(message), flush=True)

    def relay(identifier, port):
        try:
            peer = socket.create_connection(("127.0.0.1", port), timeout=10)
            peer.settimeout(None)
            peers[identifier] = peer
            send({"id": identifier, "type": "open"})
            while True:
                data = peer.recv(65536)
                if not data:
                    break
                send({"id": identifier, "type": "data", "data": base64.b64encode(data).decode()})
        except OSError:
            pass
        finally:
            peer = peers.pop(identifier, None)
            if peer:
                peer.close()
            send({"id": identifier, "type": "end"})

    for line in sys.stdin:
        message = json.loads(line)
        identifier = message["id"]
        if message["type"] == "open" and message["port"] in (cdp_port, server.server_port):
            threading.Thread(target=relay, args=(identifier, message["port"]), daemon=True).start()
        elif message["type"] == "data" and identifier in peers:
            try:
                peers[identifier].sendall(base64.b64decode(message["data"]))
            except OSError:
                pass
        elif message["type"] == "end" and identifier in peers:
            try:
                peers[identifier].shutdown(socket.SHUT_RDWR)
            except OSError:
                pass
finally:
    # A second launcher signal must not interrupt owned-child cleanup.
    signal.signal(signal.SIGHUP, signal.SIG_IGN)
    signal.signal(signal.SIGTERM, signal.SIG_IGN)
    signal.signal(signal.SIGINT, signal.SIG_IGN)
    for child in reversed(children):
        if child.poll() is None:
            child.terminate()
    for child in reversed(children):
        try:
            child.wait(timeout=4)
        except subprocess.TimeoutExpired:
            child.kill()
            child.wait()
    log.close()
    session.cleanup()
