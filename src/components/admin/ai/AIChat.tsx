'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Loader2, TrendingUp, Package, ShoppingCart, AlertTriangle } from 'lucide-react';
import type { ChatMessage, StoreContext } from '@/types';
import { formatUSD } from '@/lib/admin/utils';

const SUGGESTED_QUESTIONS = [
  'Which products are selling fastest this month?',
  'What should I restock this week?',
  'How does today compare to last week?',
  "What's my projected revenue for this month?",
  "Which products haven't sold in 30 days?",
];

interface AIChatProps {
  initialContext: StoreContext;
}

export function AIChat({ initialContext }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: ChatMessage = { role: 'user', content: text, timestamp: Date.now() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setStreaming(true);
    setStreamingText('');

    try {
      const res = await fetch('/api/admin/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          storeContext: initialContext,
        }),
      });

      if (!res.body) throw new Error('No stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        setStreamingText(full);
      }

      setMessages((prev) => [
        ...prev,
        { role: 'model', content: full, timestamp: Date.now() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'model', content: 'Sorry, something went wrong. Please try again.', timestamp: Date.now() },
      ]);
    } finally {
      setStreaming(false);
      setStreamingText('');
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-10rem)] max-h-[800px]">
      {/* Chat panel */}
      <div className="flex-1 flex flex-col bg-[#111]/80 backdrop-blur-md border border-[#1f1f1f] rounded-[8px] overflow-hidden min-w-0">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1f1f1f] flex items-center gap-3">
          <div className="w-8 h-8 bg-[#C5A021]/15 rounded-[6px] flex items-center justify-center">
            <Sparkles size={15} className="text-[#C5A021]" />
          </div>
          <div>
            <p className="text-white text-sm font-bold">Samkee&apos;s AI Assistant</p>
            <p className="text-[#444] text-xs">Gemini 2.5 Flash Â· Live store data</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-[#C5A021] rounded-full animate-pulse" />
            <span className="text-[#C5A021] text-[11px]">Online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && !streaming && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <div className="w-14 h-14 bg-[#C5A021]/10 rounded-[12px] flex items-center justify-center mb-4">
                <Sparkles size={22} className="text-[#C5A021]" />
              </div>
              <p className="text-white text-base font-bold mb-1">Ask me anything</p>
              <p className="text-[#444] text-sm mb-8 max-w-xs">
                I have access to your live inventory, sales data, and order history.
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="px-3.5 py-2 text-xs text-[#888] bg-[#161616] border border-[#1f1f1f] rounded-full hover:text-white hover:border-[#2a2a2a] transition-all duration-150 hover:bg-[#1a1a1a]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="w-6 h-6 bg-[#C5A021]/15 rounded-[4px] flex items-center justify-center mr-2.5 mt-0.5 flex-shrink-0">
                    <Sparkles size={11} className="text-[#C5A021]" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-[8px] text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#C5A021]/10 border border-[#C5A021]/20 text-white'
                      : 'bg-[#161616] border border-[#1f1f1f] text-[#ddd]'
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Streaming indicator */}
          {streaming && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="w-6 h-6 bg-[#C5A021]/15 rounded-[4px] flex items-center justify-center mr-2.5 mt-0.5 flex-shrink-0">
                <Sparkles size={11} className="text-[#C5A021]" />
              </div>
              <div className="max-w-[75%] px-4 py-3 bg-[#161616] border border-[#1f1f1f] rounded-[8px] text-sm text-[#ddd] leading-relaxed min-h-[44px]">
                {streamingText || (
                  <div className="flex items-center gap-1.5">
                    <Loader2 size={13} className="animate-spin text-[#C5A021]" />
                    <span className="text-[#555] text-xs">Thinkingâ€¦</span>
                  </div>
                )}
                {streamingText && (
                  <span className="inline-block w-0.5 h-3.5 bg-[#C5A021] ml-0.5 animate-pulse" />
                )}
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-4 border-t border-[#1f1f1f]">
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              rows={1}
              placeholder="Ask about sales, inventory, or trendsâ€¦"
              className="flex-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-[6px] px-4 py-3 text-white text-sm outline-none focus:border-[#2a2a2a] transition-colors placeholder:text-[#333] resize-none"
            />
            <button
              id="ai-send-btn"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || streaming}
              className="p-3 bg-[#C5A021] text-black rounded-[6px] hover:bg-[#A6861C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[#2a2a2a] text-[10px] mt-2 text-center">Shift+Enter for new line Â· Enter to send</p>
        </div>
      </div>

      {/* Live context panel */}
      <div className="hidden xl:flex flex-col w-64 gap-4">
        <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] p-5">
          <p className="text-[#444] text-[11px] font-bold uppercase tracking-widest mb-4">Live Context</p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#C5A021]/10 rounded-[5px] flex items-center justify-center flex-shrink-0">
                <TrendingUp size={14} className="text-[#C5A021]" />
              </div>
              <div>
                <p className="text-[#555] text-[11px]">Revenue this month</p>
                <p className="text-white text-sm font-bold">{formatUSD(initialContext.revenue)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#00b4ff]/10 rounded-[5px] flex items-center justify-center flex-shrink-0">
                <ShoppingCart size={14} className="text-[#00b4ff]" />
              </div>
              <div>
                <p className="text-[#555] text-[11px]">Pending today</p>
                <p className="text-white text-sm font-bold">{initialContext.pendingOrdersCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500/10 rounded-[5px] flex items-center justify-center flex-shrink-0">
                <Package size={14} className="text-purple-400" />
              </div>
              <div>
                <p className="text-[#555] text-[11px]">Products in stock</p>
                <p className="text-white text-sm font-bold">{initialContext.productsInStock}</p>
              </div>
            </div>
            {initialContext.lowStockItems > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-500/10 rounded-[5px] flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={14} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-[#555] text-[11px]">Low stock alerts</p>
                  <p className="text-amber-400 text-sm font-bold">{initialContext.lowStockItems}</p>
                </div>
              </div>
            )}
            {initialContext.topSeller && (
              <div className="pt-3 border-t border-[#181818]">
                <p className="text-[#444] text-[11px] mb-1">Top seller (30d)</p>
                <p className="text-white text-xs font-semibold">{initialContext.topSeller}</p>
              </div>
            )}
          </div>
        </div>
        <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] p-4">
          <p className="text-[#444] text-[11px] font-bold uppercase tracking-widest mb-3">ZiG Rate</p>
          <p className="text-white text-lg font-black font-mono">
            {initialContext.zigRate.toLocaleString()}
          </p>
          <p className="text-[#444] text-xs">per USD</p>
        </div>
      </div>
    </div>
  );
}
