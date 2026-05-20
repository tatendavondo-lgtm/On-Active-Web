'use client';

import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { InsightSkeleton } from '../ui/SkeletonLoader';
import type { StoreContext } from '@/types';

interface AIInsightBannerProps {
  storeContext: StoreContext;
}

export function AIInsightBanner({ storeContext }: AIInsightBannerProps) {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(true);
  const [displayed, setDisplayed] = useState('');

  const fetchInsight = async () => {
    setLoading(true);
    setInsight('');
    setDisplayed('');
    try {
      const res = await fetch('/api/admin/ai/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeContext }),
      });
      const data = await res.json();
      setInsight(data.insight ?? 'No insight available.');
    } catch {
      setInsight('Unable to load AI insight right now.');
    } finally {
      setLoading(false);
    }
  };

  // Typewriter effect
  useEffect(() => {
    if (!insight) return;
    let i = 0;
    setDisplayed('');
    const id = setInterval(() => {
      i++;
      setDisplayed(insight.slice(0, i));
      if (i >= insight.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [insight]);

  useEffect(() => { fetchInsight(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <InsightSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative bg-[#C5A021]/5 border border-[#C5A021]/15 rounded-[8px] p-5 backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-7 h-7 bg-[#C5A021]/15 rounded-[5px] flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles size={13} className="text-[#C5A021]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#C5A021] text-[11px] font-bold uppercase tracking-widest mb-1.5">
              AI Insight — Today
            </p>
            <AnimatePresence mode="wait">
              <p className="text-white text-sm leading-relaxed">
                {displayed || (loading ? 'Analyzing store data...' : insight)}
                {!loading && displayed.length < insight.length && (
                  <span className="inline-block w-0.5 h-3.5 bg-[#C5A021] ml-0.5 animate-pulse" />
                )}
              </p>
            </AnimatePresence>
          </div>
        </div>
        <button
          onClick={fetchInsight}
          className="p-2 text-[#C5A021]/40 hover:text-[#C5A021] transition-colors rounded-[5px] hover:bg-[#C5A021]/10 flex-shrink-0"
          title="Regenerate insight"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    </motion.div>
  );
}
