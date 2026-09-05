from http.server import BaseHTTPRequestHandler
import os
import json
from cerebras.cloud.sdk import Cerebras

# Khởi tạo client ngoài hàm handler để tối ưu tốc độ
client = Cerebras(api_key=os.environ.get("CEREBRAS_API_KEY"))

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        
        user_message = data.get("message")
        
        try:
            response = client.chat.completions.create(
                messages=[{"role": "user", "content": user_message}],
                model="llama3.1-8b",
            )
            answer = response.choices[0].message.content
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"reply": answer}).encode())
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
