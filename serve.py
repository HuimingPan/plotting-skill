#!/usr/bin/env python3
"""No-cache static HTTP server for SciPlot Pin."""
from functools import partial
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()


if __name__ == '__main__':
    root = os.path.dirname(os.path.abspath(__file__))
    handler = partial(NoCacheHandler, directory=root)
    server = HTTPServer(('127.0.0.1', 8765), handler)
    print('Serving SciPlot Pin (no-cache) at http://127.0.0.1:8765/')
    server.serve_forever()
