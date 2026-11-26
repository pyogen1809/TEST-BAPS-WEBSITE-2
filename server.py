import http.server
import sys

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

PORT = 8000
handler = NoCacheHTTPRequestHandler

class ThreadedServer(http.server.ThreadingHTTPServer):
    allow_reuse_address = True

if __name__ == '__main__':
    with ThreadedServer(("", PORT), handler) as httpd:
        print(f"Threading HTTP Server running without caching on port {PORT}...")
        sys.stdout.flush()
        httpd.serve_forever()
