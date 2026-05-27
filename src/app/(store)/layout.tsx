import { CartSidebar } from '@/components/cart-sidebar';
import { Preloader } from '@/components/preloader';
import { CustomCursor } from '@/components/custom-cursor';
import { Toaster } from 'react-hot-toast';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Preloader />
      <CustomCursor />
      {children}
      <CartSidebar />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#111111',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 'bold',
            letterSpacing: '0.04em',
          },
          success: {
            iconTheme: { primary: '#C5A021', secondary: '#0A0A0A' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
          },
        }}
      />
    </>
  );
}
