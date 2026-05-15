import type { ReactNode } from 'react';
import { SalesmanSidebar } from './SalesmanSidebar';
import { StatusBar } from './StatusBar';
import { OfflineBanner } from '../shared/OfflineBanner';

export function SalesmanShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <OfflineBanner />
      <StatusBar />
      <div className="flex flex-1 overflow-hidden">
        <SalesmanSidebar />
        <main className="flex-1 bg-[var(--pos-bg)] relative overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
