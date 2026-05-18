import { NavLink } from 'react-router-dom';
import { ShoppingBag, ClipboardList, Users, LogOut } from 'lucide-react';
import { useSessionStore } from '../../stores/sessionStore';
import { cn } from '../shared/Button';

export function SalesmanSidebar() {
  const logout = useSessionStore(s => s.logout);

  const links = [
    { to: '/sales', icon: ShoppingBag, label: 'Sales Floor', end: true },
    { to: '/sales/my-orders', icon: ClipboardList, label: 'My Orders' },
    { to: '/sales/customers', icon: Users, label: 'Customers' },
  ];

  return (
    <aside className="w-[var(--pos-sidebar-width)] bg-[var(--pos-surface-elevated)] border-r border-[var(--pos-border)] flex flex-col items-center py-6 gap-8">
      <div className="relative w-10 h-10 overflow-hidden rounded-full border-2 border-[var(--pos-accent)] shadow-[0_0_10px_rgba(197,160,33,0.2)] bg-black flex items-center justify-center">
        <img 
          src="/logo.jpg" 
          alt="On Active Wear" 
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>

      <nav className="flex-1 flex flex-col w-full gap-2 px-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center p-3 rounded-[var(--pos-radius)] text-[var(--pos-text-muted)] hover:text-white hover:bg-[var(--pos-surface-hover)] transition-all relative group",
              isActive && "text-[var(--pos-accent)] bg-[var(--pos-surface-hover)]"
            )}
            title={link.label}
          >
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute left-0 top-2 bottom-2 w-1 bg-[var(--pos-accent)] rounded-r-full" />}
                <link.icon className="w-6 h-6" />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={logout}
        className="p-3 text-[var(--pos-text-muted)] hover:text-[var(--pos-error)] hover:bg-[var(--pos-surface-hover)] rounded-[var(--pos-radius)] transition-colors"
        title="Logout"
      >
        <LogOut className="w-6 h-6" />
      </button>
    </aside>
  );
}
