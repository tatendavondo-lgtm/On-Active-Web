import type { ReceiptData } from '../../lib/receipt';

export function generateWhatsAppReceipt(data: ReceiptData): string {
  const text = encodeURIComponent(
    `🧾 *ON ACTIVE WEAR*\n` +
    `Order: ${data.orderNumber}\n` +
    `Date: ${data.date} ${data.time}\n\n` +
    `*ITEMS*\n` +
    data.items.map(i =>
      `${i.name}${i.variant ? ` (${i.variant})` : ''} x${i.qty} — $${i.lineTotal.toFixed(2)}`
    ).join('\n') +
    `\n\nSubtotal: $${data.subtotal.toFixed(2)}\n` +
    (data.autoDiscount ? `Discount (${data.autoDiscount.percentage}%): -$${data.autoDiscount.amount.toFixed(2)}\n` : '') +
    (data.manualDiscount ? `Manual Discount: -$${data.manualDiscount.amount.toFixed(2)}\n` : '') +
    `*Total: $${data.total.toFixed(2)}*\n\n` +
    `Exchange Rates:\n` +
    `1 USD = ZIG ${data.exchangeRates.ZIG.toFixed(2)}\n` +
    `1 USD = ZAR ${data.exchangeRates.ZAR.toFixed(2)}\n\n` +
    `Thank you for shopping at On Active! 💪`
  );

  return `https://wa.me/?text=${text}`;
}
