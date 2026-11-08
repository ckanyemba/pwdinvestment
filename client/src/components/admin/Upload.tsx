'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/client-api';

export type UploadedFile = { url: string; publicId?: string; name?: string; resourceType?: string };

/** Uploads to /api/admin/uploads (→ Cloudinary). */
export function UploadButton({ onUploaded, accept = 'image/*,application/pdf', folder = 'uploads', label = 'Upload' }: {
  onUploaded: (f: UploadedFile) => void;
  accept?: string;
  folder?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  return (
    <div>
      <label className="btn btn-ghost btn-sm cursor-pointer">
        {busy ? 'Uploading…' : label}
        <input
          type="file"
          accept={accept}
          className="sr-only"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            const body = new FormData();
            body.append('file', file);
            body.append('folder', folder);
            setBusy(true);
            setError(undefined);
            try {
              onUploaded(await apiFetch<UploadedFile>('/admin/uploads', { method: 'POST', body }));
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
