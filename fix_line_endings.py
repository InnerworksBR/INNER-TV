
import os

file_path = r'c:\Apps\TV_Corp\backend\supabase-docker\volumes\pooler\pooler.exs'
with open(file_path, 'rb') as f:
    content = f.read()

# Replace CRLF with LF
content = content.replace(b'\r\n', b'\n')

with open(file_path, 'wb') as f:
    f.write(content)

print("Line endings converted to LF.")
