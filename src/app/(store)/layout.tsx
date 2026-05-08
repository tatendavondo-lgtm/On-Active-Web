import { CartSidebar } from '@/components/cart-sidebar';
import { Preloader } from '@/components/preloader';
import { CustomCursor } from '@/components/custom-cursor';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Preloader />
      <CustomCursor />
      {children}
      <CartSidebar />
    </>
  );
}
