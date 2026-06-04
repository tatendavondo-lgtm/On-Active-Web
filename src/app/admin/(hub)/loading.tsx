import { Loader2 } from 'lucide-react';

export default function HubLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] w-full">
      <Loader2 size={24} className="animate-spin text-[#C5A021] mb-4" />
      <p className="text-[#666] text-[10px] font-bold uppercase tracking-widest animate-pulse">
        Loading Workspace...
      </p>
    </div>
  );
}
