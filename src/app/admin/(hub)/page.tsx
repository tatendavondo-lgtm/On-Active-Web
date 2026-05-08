import { redirect } from 'next/navigation';

// /admin â†’ redirect to /admin/dashboard
export default function AdminIndexPage() {
  redirect('/admin/dashboard');
}
