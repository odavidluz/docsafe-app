import os
import json
import uuid
from datetime import datetime
from vault_core import encrypt_file, decrypt_file

CATALOG_PATH = os.path.join("vault", "catalog.dsf")
TEMP_CATALOG = os.path.join(".tmp", "catalog.json")

def load_catalog(password):
      if not os.path.exists(CATALOG_PATH):
                return []
            if decrypt_file(CATALOG_PATH, password, TEMP_CATALOG):
                      with open(TEMP_CATALOG, 'r', encoding='utf-8') as f:
                                    data = json.load(f)
                                os.remove(TEMP_CATALOG)
        return data
else:
        return None

def save_catalog(catalog_data, password):
      with open(TEMP_CATALOG, 'w', encoding='utf-8') as f:
                json.dump(catalog_data, f, indent=4)
    success = encrypt_file(TEMP_CATALOG, password, CATALOG_PATH)
    os.remove(TEMP_CATALOG)
    return success

def add_document(src_path, filename, category, password):
      catalog = load_catalog(password)
    if catalog is None and os.path.exists(CATALOG_PATH):
              print("Error: Invalid password for existing catalog.")
        return False
elif catalog is None:
        catalog = []
    doc_id = str(uuid.uuid4())
    secure_filename = f"{doc_id}.dsf"
    dst_path = os.path.join("vault", secure_filename)
    if encrypt_file(src_path, password, dst_path):
              new_entry = {
                            "id": doc_id,
                            "original_name": filename,
                            "category": category,
                            "secure_path": secure_filename,
                            "added_at": datetime.now().isoformat(),
                            "size": os.path.getsize(src_path)
              }
        catalog.append(new_entry)
        return save_catalog(catalog, password)
    return False
