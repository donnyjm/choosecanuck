import http.server
import socketserver

PORT = 7100
DIRECTORY = "/Users/itsallgood/Documents/kimi/workspace/north-supply/app/public"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    print(f"ChooseCanuck running at http://127.0.0.1:{PORT}/")
    httpd.serve_forever()
