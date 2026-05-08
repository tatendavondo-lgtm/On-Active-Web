import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'On Active Admin Hub',
  description: 'Premium AI-powered management dashboard â€” On Active fitness apparel.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111111',
            color: '#ffffff',
            border: '1px solid #1f1f1f',
            borderRadius: '6px',
            fontSize: '13px',
          },
        }}
      />
      {children}
    </>
  );
}
