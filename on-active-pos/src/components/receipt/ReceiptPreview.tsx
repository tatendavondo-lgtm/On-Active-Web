import { printerService } from '../../lib/printer';
import type { ReceiptData } from '../../lib/receipt';
import { generateWhatsAppReceipt } from './DigitalReceipt';
import { Button } from '../shared/Button';
import { Printer, MessageCircle, RefreshCcw } from 'lucide-react';

interface ReceiptPreviewProps {
  data: ReceiptData;
  onNewSale: () => void;
}

export function ReceiptPreview({ data, onNewSale }: ReceiptPreviewProps) {
  const handlePrint = async () => {
    try {
      await printerService.printReceipt(data);
    } catch (e) {
      alert('Failed to print: ' + (e as Error).message);
    }
  };

  const handleWhatsApp = () => {
    const url = generateWhatsAppReceipt(data);
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-sm bg-white text-black p-8 shadow-2xl rounded-sm font-mono text-sm">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold uppercase tracking-tighter">On Active Wear</h2>
          <p className="text-[10px] opacity-70">{data.storeAddress}</p>
          <p className="text-[10px] opacity-70">Tel: {data.storePhone}</p>
        </div>

        <div className="flex justify-between text-[10px] mb-1 opacity-70">
          <span>Date: {data.date}</span>
          <span>Time: {data.time}</span>
        </div>
        <div className="text-[10px] mb-4 opacity-70">
          Order: {data.orderNumber}
        </div>

        <div className="border-t border-dashed border-black/20 my-4" />

        <div className="space-y-3">
          {data.items.map((item, i) => (
            <div key={i}>
              <div className="flex justify-between font-bold">
                <span className="truncate flex-1">{item.name}</span>
                <span className="ml-2">${item.lineTotal.toFixed(2)}</span>
              </div>
              <div className="text-[10px] opacity-60">
                x{item.qty} @ ${item.unitPrice.toFixed(2)} {item.variant ? `(${item.variant})` : ''}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-black/20 my-4" />

        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span>Subtotal</span>
            <span>${data.subtotal.toFixed(2)}</span>
          </div>
          {data.autoDiscount && (
            <div className="flex justify-between text-[10px] text-emerald-700">
              <span>Auto Discount ({data.autoDiscount.percentage}%)</span>
              <span>-${data.autoDiscount.amount.toFixed(2)}</span>
            </div>
          )}
          {data.manualDiscount && (
            <div className="flex justify-between text-[10px] text-emerald-700">
              <span>Manual Discount</span>
              <span>-${data.manualDiscount.amount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2">
            <span>TOTAL</span>
            <span>${data.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-black/20 my-4" />

        <div className="space-y-1 text-[10px]">
          <p className="font-bold opacity-70 mb-1">Payments</p>
          {data.payments.map((p, i) => (
            <div key={i} className="flex justify-between">
              <span className="capitalize">{p.method} ({p.currency})</span>
              <span>{p.localAmount ? `${p.currency} ${p.localAmount.toFixed(2)}` : `$${p.amount.toFixed(2)}`}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-black/20 my-4" />

        <div className="text-center text-[10px] opacity-60 leading-tight">
          {data.footer.split('\n').map((line, i) => <p key={i}>{line}</p>)}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 w-full max-w-sm">
        <Button 
          variant="secondary" 
          className="flex-1 min-w-[140px]" 
          onClick={handlePrint}
        >
          <Printer className="w-4 h-4 mr-2" />
          Print Thermal
        </Button>
        <Button 
          variant="secondary" 
          className="flex-1 min-w-[140px]" 
          onClick={handleWhatsApp}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          WhatsApp
        </Button>
        <Button 
          variant="primary" 
          className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-500" 
          onClick={onNewSale}
        >
          <RefreshCcw className="w-5 h-5 mr-2" />
          New Sale
        </Button>
      </div>
    </div>
  );
}
