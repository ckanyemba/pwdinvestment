import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

// The SDK reads CLOUDINARY_URL (cloudinary://key:secret@cloud) from the environment.
export const cloudinaryEnabled = Boolean(env.CLOUDINARY_URL);
if (cloudinaryEnabled) cloudinary.config({ secure: true });

/** Upload a Buffer and resolve with the Cloudinary result. */
export function uploadBuffer(buffer, { folder = 'uploads', resourceType = 'auto', publicId } = {}) {
  if (!cloudinaryEnabled) return Promise.reject(Object.assign(new Error('Cloudinary is not configured'), { status: 503 }));
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `${env.CLOUDINARY_FOLDER}/${folder}`, resource_type: resourceType, public_id: publicId, overwrite: true },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
    stream.end(buffer);
  });
}

export function destroyAsset(publicId, resourceType = 'image') {
  if (!cloudinaryEnabled || !publicId) return Promise.resolve();
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export { cloudinary };
