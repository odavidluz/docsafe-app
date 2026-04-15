from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import vault_index as indexer
from vault_core import decrypt_file

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
app = Flask(__name__, static_folder=ROOT_DIR, static_url_path='')
CORS(app)

@app.route('/')
def index():
      return send_file(os.path.join(ROOT_DIR, 'index.html'))

session_key = None

@app.route('/api/unlock', methods=['POST'])
def unlock():
      global session_key
      data = request.json
      password = data.get('password')
      catalog = indexer.load_catalog(password)
      if catalog is not None:
                session_key = password
                return jsonify({"status": "success", "docs": catalog})
            return jsonify({"status": "error", "message": "Auth Error"}), 401

@app.route('/api/list', methods=['GET'])
def list_docs():
      if not session_key:
                return jsonify({"status": "locked"}), 403
            return jsonify(indexer.load_catalog(session_key))

@app.route('/api/document/<doc_id>', methods=['GET'])
def view_doc(doc_id):
      if not session_key:
                return jsonify({"status": "locked"}), 403
            catalog = indexer.load_catalog(session_key)
    doc = next((d for d in catalog if d['id'] == doc_id), None)
    if not doc:
              return jsonify({"error": "NotFound"}), 404
          src = os.path.join("vault", doc['secure_path'])
    tmp_out = os.path.join(".tmp", f"view_{doc['original_name']}")
    if decrypt_file(src, session_key, tmp_out):
              return send_file(tmp_out)
          return jsonify({"error": "DecryptError"}), 500

@app.route('/api/upload', methods=['POST'])
def upload():
      if not session_key:
                return jsonify({"status": "locked"}), 403
            file = request.files.get('file')
    filename = request.form.get('filename')
    category = request.form.get('category', 'Other')
    if not file:
              return jsonify({"error": "NoFile"}), 400
          path = os.path.join(".tmp", filename)
    file.save(path)
    if indexer.add_document(path, filename, category, session_key):
              os.remove(path)
              return jsonify({"status": "success"})
          return jsonify({"error": "StorageError"}), 500

if __name__ == "__main__":
      os.makedirs(".tmp", exist_ok=True)
    os.makedirs("vault", exist_ok=True)
    app.run(host='0.0.0.0', port=5000, debug=True)

