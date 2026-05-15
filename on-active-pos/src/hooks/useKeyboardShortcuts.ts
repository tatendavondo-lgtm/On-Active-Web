import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          (e.target as any).blur();
        }
        return;
      }

      switch (e.key) {
        case 'F1':
          e.preventDefault();
          navigate('/till');
          break;
        case 'F2':
          e.preventDefault();
          // Hold transaction logic would go here
          console.log('F2: Hold transaction');
          break;
        case 'F3':
          e.preventDefault();
          // Recall transaction logic would go here
          console.log('F3: Recall transaction');
          break;
        case 'F8':
          e.preventDefault();
          // This should ideally trigger the payment modal
          // We'll need a way to signal this to the TillRegister component
          window.dispatchEvent(new CustomEvent('pos-trigger-payment'));
          break;
        case 'Escape':
          // Close modals (handled by Modal component usually, but good to have)
          break;
        default:
          // Quick product search: if alphanumeric and no modifiers, focus search
          if (/^[a-z0-9]$/i.test(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey) {
             const searchInput = document.querySelector('input[placeholder*="search"]') as HTMLInputElement;
             if (searchInput) {
               searchInput.focus();
             }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
}
