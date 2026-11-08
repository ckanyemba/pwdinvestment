import { blindIndex, decrypt, encrypt } from '../../lib/crypto.js';

const hashPath = (path) => `${path.replace(/\./g, '_')}Hash`;

/**
 * Encrypts the given (possibly dotted) string paths at rest with AES-256-GCM. For each path a
 * `<path>Hash` blind index is stored so records can be matched by exact value (and kept unique)
 * without decrypting. Encryption happens in pre('save'); always mutate via doc.set() + save().
 * Output of toJSON()/toObject() is decrypted; use Model.decryptDoc() for lean() results.
 */
export function encryptedFields(schema, { fields, unique = [] }) {
  for (const path of fields) {
    schema.add({ [hashPath(path)]: { type: String } });
    schema.index({ [hashPath(path)]: 1 }, unique.includes(path) ? { unique: true, sparse: true } : {});
  }

  schema.pre('save', function () {
    for (const path of fields) {
      if (!this.isModified(path)) continue;
      const plain = this.get(path);
      if (typeof plain === 'string' && plain.startsWith('enc:')) continue;
      this.set(hashPath(path), blindIndex(plain));
      this.set(path, encrypt(plain));
    }
  });

  const transform = (_doc, ret) => decryptDoc(ret, fields);
  schema.set('toJSON', { virtuals: true, versionKey: false, transform });
  schema.set('toObject', { transform });
  schema.statics.decryptDoc = (doc) => decryptDoc(doc, fields);
  schema.statics.hashOf = blindIndex;
}

export function decryptDoc(doc, fields) {
  if (!doc) return doc;
  for (const path of fields) {
    const parts = path.split('.');
    let obj = doc;
    for (let i = 0; i < parts.length - 1 && obj; i++) obj = obj[parts[i]];
    const last = parts.at(-1);
    if (obj && obj[last] != null) {
      try {
        obj[last] = decrypt(obj[last]);
      } catch {
        obj[last] = null; // wrong key or corrupted value
      }
    }
    delete doc[hashPath(path)];
  }
  return doc;
}
