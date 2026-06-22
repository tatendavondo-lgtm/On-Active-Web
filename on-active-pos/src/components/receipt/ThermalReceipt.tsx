import { Printer, Text, Line, Row, Br, Cut } from 'react-thermal-printer';
import type { ReceiptData } from '../../lib/receipt';

export function ThermalReceipt({ data }: { data: ReceiptData }) {
  const totalZig = data.total * data.exchangeRates.ZIG;
  const totalZar = data.total * data.exchangeRates.ZAR;

  return (
    <Printer type="epson" width={42}>
      <Text align="center" size={{ width: 2, height: 2 }} bold>ON ACTIVE WEAR</Text>
      <Text align="center">{data.storeAddress}</Text>
      <Text align="center">Tel: {data.storePhone}</Text>
      <Line />
      <Row left={`Date: ${data.date}`} right={`Time: ${data.time}`} />
      <Text>Order: {data.orderNumber}</Text>
      <Text>Cashier: {data.cashier}</Text>
      {data.salesman && <Text>Salesman: {data.salesman}</Text>}
      <Line />
      {data.items.map((item, i) => (
        <div key={i}>
          <Text>{item.name} {item.variant ? `(${item.variant})` : ''}</Text>
          <Row left={`  x${item.qty} @ $${item.unitPrice.toFixed(2)}`} right={`$${item.lineTotal.toFixed(2)}`} />
        </div>
      ))}
      <Line />
      <Row left="Subtotal:" right={`$${data.subtotal.toFixed(2)}`} />
      {data.autoDiscount && (
        <Row left={`Auto Discount (${data.autoDiscount.percentage}%):`} right={`-$${data.autoDiscount.amount.toFixed(2)}`} />
      )}
      {data.manualDiscount && (
        <Row left={`Manual Discount:`} right={`-$${data.manualDiscount.amount.toFixed(2)}`} />
      )}
      <Line />
      <Text align="right" size={{ width: 2, height: 1 }} bold>TOTAL: ${data.total.toFixed(2)}</Text>
      <Line />
      
      <Text bold>Payment Details:</Text>
      {data.payments.map((p, i) => (
        <Row key={i} left={`${p.method} (${p.currency}):`} right={p.localAmount ? `${p.currency} ${p.localAmount.toFixed(2)}` : `$${p.amount.toFixed(2)}`} />
      ))}
      
      {data.cashTendered !== undefined && (
        <>
          <Row left="Cash Tendered:" right={`${data.cashTenderedCurrency} ${data.cashTendered.toFixed(2)}`} />
          <Row left="Change Due:" right={`${data.changeCurrency} ${(data.changeGiven || 0).toFixed(2)}`} />
        </>
      )}

      <Line />
      <Text size={{ width: 1, height: 1 }}>Exchange Rates:</Text>
      <Text>  1 USD = ZIG {data.exchangeRates.ZIG.toFixed(2)}</Text>
      <Text>  1 USD = ZAR {data.exchangeRates.ZAR.toFixed(2)}</Text>
      <Br />
      <Text>Total in ZIG: ZIG {totalZig.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
      <Text>Total in ZAR: ZAR {totalZar.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
      
      <Line />
      <Text align="center">{data.footer}</Text>
      <Br />
      <Cut />
    </Printer>
  );
}
