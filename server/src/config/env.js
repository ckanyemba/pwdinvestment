import { z } from 'zod';

const list = (v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  // Comma-separated list of allowed browser origins (the Next.js client).
  CLIENT_ORIGINS: z.string().default('http://localhost:3000').transform(list),
  // Public base URL of this API; used to serve seed media when Cloudinary is not configured.
  PUBLIC_API_URL: z.string().default('http://localhost:4000'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  // 32-byte key, hex (64 chars) or base64, for field-level encryption of ID/bank numbers.
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY is required'),

  GOOGLE_CLIENT_ID: z.string().default(''),
  ADMIN_EMAILS: z.string().default('').transform(list),

  RECAPTCHA_SECRET: z.string().default(''),
  RECAPTCHA_MIN_SCORE: z.coerce.number().default(0.5),

  GMAIL_USER: z.string().default(''),
  GMAIL_APP_PASSWORD: z.string().default(''),
  GMAIL_CLIENT_ID: z.string().default(''),
  GMAIL_CLIENT_SECRET: z.string().default(''),
  GMAIL_REFRESH_TOKEN: z.string().default(''),
  NOTIFY_EMAILS: z.string().default('admin@pmdinvestment.co.za').transform(list),

  CLOUDINARY_URL: z.string().default(''),
  CLOUDINARY_FOLDER: z.string().default('pmd'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
