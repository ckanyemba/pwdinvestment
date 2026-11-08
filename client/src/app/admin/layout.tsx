import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };

// Client-rendered staff area. Every API call is authorised server-side (Google sign-in + allow-list).
export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return <AdminShell>{children}</AdminShell>;
}
