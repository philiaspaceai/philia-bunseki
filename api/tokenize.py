from http.server import BaseHTTPRequestHandler
import json
import sys

# Try importing sudachipy. If it fails, we handle it in handler
try:
    from sudachipy import tokenizer, dictionary
    tokenizer_obj = dictionary.Dictionary(dict="core").create()
    mode = tokenizer.Tokenizer.SplitMode.C
    SUDACHI_AVAILABLE = True
except ImportError:
    SUDACHI_AVAILABLE = False

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # 1. CORS Headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
        # 2. Check content length
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'No content sent'}).encode('utf-8'))
                return

            body = self.rfile.read(content_length)
            data = json.loads(body)
            text = data.get('text', '')

            if not text:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'No text provided'}).encode('utf-8'))
                return

            # 3. Tokenize logic
            if not SUDACHI_AVAILABLE:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'SudachiPy not installed in the server environment. Ensure "sudachipy" and "sudachidict_core" are in requirements.txt'
                }).encode('utf-8'))
                return

            # Max text length protection for Vercel timeout
            if len(text) > 100000:
                text = text[:100000]

            tokens = [m.dictionary_form() for m in tokenizer_obj.tokenize(text, mode)]

            # 4. Success Response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'tokens': tokens}).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
