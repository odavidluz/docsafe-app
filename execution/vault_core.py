import os
import sys
import base64
import argparse
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag

KDF_ITERATIONS = 600000
SALT_SIZE = 16
NONCE_SIZE = 12

def derive_key(password: str, salt: bytes) -> bytes:
      kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=KDF_ITERATIONS,
      )
      return kdf.derive(password.encode())

def encrypt_file(file_path: str, password: str, output_path: str):
      if not os.path.exists(file_path):
                return False
            salt = os.urandom(SALT_SIZE)
    nonce = os.urandom(NONCE_SIZE)
    key = derive_key(password, salt)
    aesgcm = AESGCM(key)
    with open(file_path, 'rb') as f:
              data = f.read()
          ciphertext = aesgcm.encrypt(nonce, data, None)
    with open(output_path, 'wb') as f:
              f.write(salt + nonce + ciphertext)
          return True

def decrypt_file(encrypted_path: str, password: str, output_path: str):
      if not os.path.exists(encrypted_path):
                return False
            with open(encrypted_path, 'rb') as f:
                      file_data = f.read()
                  salt = file_data[:SALT_SIZE]
    nonce = file_data[SALT_SIZE:SALT_SIZE + NONCE_SIZE]
    ciphertext = file_data[SALT_SIZE + NONCE_SIZE:]
    try:
              key = derive_key(password, salt)
              aesgcm = AESGCM(key)
              decrypted_data = aesgcm.decrypt(nonce, ciphertext, None)
              with open(output_path, 'wb') as f:
                            f.write(decrypted_data)
                        return True
except Exception:
        return False
