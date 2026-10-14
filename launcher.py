"""Start the local app and open Chrome; no extra packages required."""
import functools
import http.server
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import urllib.request

ROOT = Path(__file__).resolve().parent
PORTS = range(18765, 18785)
IDENTITY = str(ROOT)

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/__trend_desk_health':
            body = json.dumps({'project': IDENTITY}).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def log_message(self, format, *args):
        pass

def is_running(port):
    try:
        with urllib.request.urlopen(f'http://127.0.0.1:{port}/__trend_desk_health', timeout=.5) as response:
            return json.load(response).get('project') == IDENTITY
    except Exception:
        return False

def serve(port):
    server = http.server.ThreadingHTTPServer(('127.0.0.1', port), functools.partial(Handler, directory=str(ROOT)))
    server.serve_forever()

def launch():
    # Find this project's existing server across all ports before starting one.
    port = next((candidate for candidate in PORTS if is_running(candidate)), None)
    if port is None:
        for candidate in PORTS:
            process = subprocess.Popen([sys.executable, str(Path(__file__).resolve()), '--serve', str(candidate)],
                                       stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                                       stderr=subprocess.DEVNULL, start_new_session=True)
            for _ in range(25):
                if is_running(candidate) or process.poll() is not None:
                    break
                time.sleep(.1)
            if is_running(candidate):
                port = candidate
                break
            if process.poll() is None:
                process.terminate()
        else:
            raise RuntimeError('Không khởi động được ứng dụng trên máy này.')
    url = f'http://127.0.0.1:{port}/'
    if '--no-browser' not in sys.argv:
        opened = subprocess.run(['open', '-a', 'Google Chrome', url], check=False)
        if opened.returncode:
            subprocess.run(['open', url], check=True)
    print('Trend Desk Hub: ' + url)

if __name__ == '__main__':
    try:
        if len(sys.argv) > 2 and sys.argv[1] == '--serve':
            serve(int(sys.argv[2]))
        else:
            launch()
    except Exception as error:
        print('Lỗi: ' + str(error), file=sys.stderr)
        sys.exit(1)
