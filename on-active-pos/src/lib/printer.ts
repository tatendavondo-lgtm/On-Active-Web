import type { ReceiptData } from './receipt';
import { Capacitor } from '@capacitor/core';
import { BluetoothSerial, type BluetoothDevice } from '@fmesasc/capacitor-bluetooth-serial';

export interface PrinterStatus {
  connected: boolean;
  deviceName?: string;
  deviceAddress?: string;
  type: '58mm' | '80mm';
}

// ESC/POS command constants
const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;

const CMD = {
  INIT: new Uint8Array([ESC, 0x40]),               // Initialize printer
  BOLD_ON: new Uint8Array([ESC, 0x45, 0x01]),      // Bold on
  BOLD_OFF: new Uint8Array([ESC, 0x45, 0x00]),     // Bold off
  ALIGN_CENTER: new Uint8Array([ESC, 0x61, 0x01]), // Center align
  ALIGN_LEFT: new Uint8Array([ESC, 0x61, 0x00]),   // Left align
  ALIGN_RIGHT: new Uint8Array([ESC, 0x61, 0x02]),  // Right align
  DOUBLE_HEIGHT: new Uint8Array([ESC, 0x21, 0x10]),// Double height
  NORMAL_SIZE: new Uint8Array([ESC, 0x21, 0x00]),  // Normal size
  CUT: new Uint8Array([GS, 0x56, 0x00]),           // Full cut
  PARTIAL_CUT: new Uint8Array([GS, 0x56, 0x01]),  // Partial cut
  FEED_3: new Uint8Array([ESC, 0x64, 0x03]),       // Feed 3 lines
  FEED_5: new Uint8Array([ESC, 0x64, 0x05]),       // Feed 5 lines
  LINE: new Uint8Array([LF]),
};

function textToBytes(text: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(text);
}

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

function padRight(text: string, width: number): string {
  return text.length >= width ? text.substring(0, width) : text + ' '.repeat(width - text.length);
}

function formatLine(left: string, right: string, totalWidth = 32): string {
  const rightLen = right.length;
  const leftMax = totalWidth - rightLen - 1;
  return padRight(left, leftMax) + ' ' + right;
}

function dashedLine(width = 32): string {
  return '-'.repeat(width);
}

// Asynchronously load an image URL into an HTMLImageElement
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

// Convert HTMLImageElement to ESC/POS raster format (GS v 0) bytes
function getLogoEscPosBytes(img: HTMLImageElement, targetWidth = 128): Uint8Array {
  // ESC/POS image width must be a multiple of 8
  const width = Math.floor(targetWidth / 8) * 8;
  const height = Math.floor((img.height / img.width) * width);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Uint8Array(0);

  ctx.drawImage(img, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // ESC/POS raster format: GS v 0 m xL xH yL yH d1...dk
  const bytesWidth = width / 8;
  const rawBytes = new Uint8Array(bytesWidth * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < bytesWidth; x++) {
      let byteValue = 0;
      for (let bit = 0; bit < 8; bit++) {
        const pixelX = x * 8 + bit;
        const offset = (y * width + pixelX) * 4;
        
        // RGBA values
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        const a = data[offset + 3];
        
        // If the pixel is semi-transparent, treat it as white.
        // Otherwise, use standard luminance formula to threshold at ~160.
        const isBlack = a > 50 && (0.299 * r + 0.587 * g + 0.114 * b) < 160;
        
        if (isBlack) {
          byteValue |= (1 << (7 - bit));
        }
      }
      rawBytes[y * bytesWidth + x] = byteValue;
    }
  }

  // Width and height properties mapped as ESC/POS expects
  const xL = bytesWidth & 0xFF;
  const xH = (bytesWidth >> 8) & 0xFF;
  const yL = height & 0xFF;
  const yH = (height >> 8) & 0xFF;

  const header = new Uint8Array([0x1D, 0x76, 0x30, 0, xL, xH, yL, yH]);
  const result = new Uint8Array(header.length + rawBytes.length);
  result.set(header, 0);
  result.set(rawBytes, header.length);
  return result;
}

class PrinterService {
  private characteristic: any = null;
  private status: PrinterStatus = { connected: false, type: '58mm' };

  constructor() {
    // Auto-connect and keep-alive loops at startup on native platform
    if (Capacitor.isNativePlatform()) {
      this.startAutoReconnectLoop();
    }
  }

  private startAutoReconnectLoop() {
    console.log('Initializing Printer Auto-Reconnect & Keep-Alive Daemon...');
    // Initial attempt on startup (wait 1.5 seconds for hardware states to stabilize)
    setTimeout(() => {
      this.connectPrinter().catch(() => {});
    }, 1500);

    // Dynamic background daemon checking and reconnecting every 10 seconds
    setInterval(async () => {
      if (!this.status.connected) {
        const lastAddress = localStorage.getItem('lastPrinterAddress');
        if (lastAddress) {
          console.log('Printer offline. Background daemon attempting reconnection to:', lastAddress);
          await this.connectPrinter().catch(() => {});
        }
      }
    }, 10000);
  }

  async scanNativePrinters(): Promise<BluetoothDevice[]> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Not on native platform, scanning not supported');
      return [];
    }
    
    try {
      const state = await BluetoothSerial.isEnabled();
      if (!state.enabled) {
        await BluetoothSerial.enable();
      }
      
      console.log('Scanning for native bluetooth devices...');
      const result = await BluetoothSerial.scan();
      return result.devices;
    } catch (e: any) {
      console.error('Failed scanning bluetooth devices:', e);
      throw e;
    }
  }

  async connectNativePrinter(address: string): Promise<boolean> {
    try {
      console.log('Connecting to native printer at:', address);
      await BluetoothSerial.connect({ address });
      this.status = { connected: true, deviceAddress: address, type: '80mm' };
      localStorage.setItem('lastPrinterAddress', address);
      return true;
    } catch (error: any) {
      console.error('Native Bluetooth Connection Failed:', error);
      this.status.connected = false;
      return false;
    }
  }

  async connectPrinter(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      const lastAddress = localStorage.getItem('lastPrinterAddress');
      if (lastAddress) {
        return await this.connectNativePrinter(lastAddress);
      }
      return false;
    }

    try {
      console.log('Requesting Web Bluetooth Printer...');
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: ['0000ff00-0000-1000-8000-00805f9b34fb', '0000ae00-0000-1000-8000-00805f9b34fb']
      });

      const server = await device.gatt?.connect();
      if (!server) throw new Error('Could not connect to GATT server');

      const services = await server.getPrimaryServices();
      let foundChar = null;

      for (const service of services) {
        const chars = await service.getCharacteristics();
        foundChar = chars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);
        if (foundChar) break;
      }

      if (!foundChar) throw new Error('No writeable characteristic found');

      this.characteristic = foundChar;
      this.status = { connected: true, deviceName: device.name, type: '80mm' };
      
      console.log('Connected to:', device.name);
      return true;
    } catch (error: any) {
      console.error('Web Bluetooth Connection Failed:', error);
      alert('Connection failed: ' + error.message);
      return false;
    }
  }

  async printRaw(data: Uint8Array): Promise<void> {
    // If connection was lost or not established, trigger an instant sync-reconnect attempt
    if (!this.status.connected) {
      console.log('Print requested but printer disconnected. Attempting instant reconnect...');
      const reconnected = await this.connectPrinter();
      if (!reconnected) throw new Error('Printer is not connected. Please ensure it is powered on.');
    }

    if (Capacitor.isNativePlatform() && this.status.deviceAddress) {
      console.log('Printing via Native Bluetooth Serial...', data.length, 'bytes');
      const byteArray = Array.from(data);
      try {
        await BluetoothSerial.write({ address: this.status.deviceAddress, value: byteArray });
      } catch (err) {
        console.error('Failed to write to Bluetooth printer, flag disconnected:', err);
        this.status.connected = false;
        throw err;
      }
      return;
    }

    if (!this.characteristic) throw new Error('Web Printer not connected');
    
    console.log('Printing via Web Bluetooth...');
    const CHUNK_SIZE = 20;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      await this.characteristic.writeValue(chunk);
    }
  }

  async printReceipt(data: ReceiptData): Promise<void> {
    console.log('Printing receipt via thermal printer...');
    const W = this.status.type === '80mm' ? 48 : 32;

    // Load and convert logo image
    let logoBytes: Uint8Array | null = null;
    try {
      const img = await loadImage('/logo.jpg');
      const targetW = this.status.type === '80mm' ? 180 : 120;
      logoBytes = getLogoEscPosBytes(img, targetW);
      console.log('Logo converted successfully for thermal receipt:', logoBytes.length, 'bytes');
    } catch (e) {
      console.warn('Could not load logo for thermal print, printing text-only header:', e);
    }

    const parts: Uint8Array[] = [
      CMD.INIT,
      CMD.ALIGN_CENTER,
    ];

    // Embed the logo if loaded, otherwise fallback gracefully to text-only header
    if (logoBytes) {
      parts.push(logoBytes, CMD.LINE, CMD.LINE);
    }

    // Clean up address (remove "Harare CBD" or "CBD, Harare" and just put "Harare")
    const cleanAddress = data.storeAddress.replace(/CBD,\s*Harare/i, 'Harare').replace(/Harare\s*CBD/i, 'Harare');

    parts.push(
      CMD.BOLD_ON,
      CMD.DOUBLE_HEIGHT,
      textToBytes('ON ACTIVE WEAR'), CMD.LINE,
      CMD.NORMAL_SIZE,
      CMD.BOLD_OFF,
      textToBytes('"OWN IT, WEAR IT, FEEL IT"'), CMD.LINE,
      textToBytes(cleanAddress), CMD.LINE,
      textToBytes('Tel: ' + data.storePhone), CMD.LINE,
      CMD.LINE,
      // Order info
      CMD.ALIGN_LEFT,
      textToBytes(formatLine('Date: ' + data.date, 'Time: ' + data.time, W)), CMD.LINE,
      textToBytes('Order: ' + data.orderNumber), CMD.LINE,
      textToBytes('Cashier: ' + data.cashier), CMD.LINE,
    );

    if (data.salesman) {
      parts.push(textToBytes('Sales: ' + data.salesman), CMD.LINE);
    }

    parts.push(textToBytes(dashedLine(W)), CMD.LINE);

    // Items
    for (const item of data.items) {
      const label = item.variant ? `${item.name} (${item.variant})` : item.name;
      parts.push(
        CMD.BOLD_ON,
        textToBytes(formatLine(label, '$' + item.lineTotal.toFixed(2), W)), CMD.LINE,
        CMD.BOLD_OFF,
        textToBytes('  x' + item.qty + ' @ $' + item.unitPrice.toFixed(2)), CMD.LINE,
      );
    }

    parts.push(textToBytes(dashedLine(W)), CMD.LINE);

    // Totals
    parts.push(textToBytes(formatLine('Subtotal', '$' + data.subtotal.toFixed(2), W)), CMD.LINE);

    if (data.autoDiscount) {
      parts.push(textToBytes(formatLine(`Auto Discount (${data.autoDiscount.percentage}%)`, '-$' + data.autoDiscount.amount.toFixed(2), W)), CMD.LINE);
    }
    if (data.manualDiscount) {
      parts.push(textToBytes(formatLine('Manual Discount', '-$' + data.manualDiscount.amount.toFixed(2), W)), CMD.LINE);
    }

    parts.push(
      textToBytes(dashedLine(W)), CMD.LINE,
      CMD.BOLD_ON,
      CMD.DOUBLE_HEIGHT,
      textToBytes(formatLine('TOTAL', '$' + data.total.toFixed(2), W)), CMD.LINE,
      CMD.NORMAL_SIZE,
      CMD.BOLD_OFF,
      textToBytes(dashedLine(W)), CMD.LINE,
    );

    // Payments
    parts.push(CMD.BOLD_ON, textToBytes('Payments:'), CMD.LINE, CMD.BOLD_OFF);
    for (const p of data.payments) {
      const label = `${p.method.toUpperCase()} (${p.currency})`;
      const value = p.localAmount ? `${p.currency} ${p.localAmount.toFixed(2)}` : `$${p.amount.toFixed(2)}`;
      parts.push(textToBytes(formatLine(label, value, W)), CMD.LINE);
    }

    if (data.cashTendered) {
      parts.push(
        textToBytes(dashedLine(W)), CMD.LINE,
        textToBytes(formatLine('Cash Tendered', '$' + data.cashTendered.toFixed(2), W)), CMD.LINE,
      );
      if (data.changeGiven) {
        parts.push(textToBytes(formatLine('Change', '$' + data.changeGiven.toFixed(2), W)), CMD.LINE);
      }
    }

    // Footer
    parts.push(
      textToBytes(dashedLine(W)), CMD.LINE,
      CMD.ALIGN_CENTER,
    );
    for (const line of data.footer.split('\n')) {
      parts.push(textToBytes(line), CMD.LINE);
    }

    // Feed and cut
    parts.push(CMD.FEED_5, CMD.PARTIAL_CUT);

    const payload = concatBytes(...parts);
    await this.printRaw(payload);
  }

  async testPrint(): Promise<void> {
    console.log('Sending test print...');
    const W = this.status.type === '80mm' ? 48 : 32;

    // Load and convert logo image
    let logoBytes: Uint8Array | null = null;
    try {
      const img = await loadImage('/logo.jpg');
      const targetW = this.status.type === '80mm' ? 180 : 120;
      logoBytes = getLogoEscPosBytes(img, targetW);
    } catch (e) {
      console.warn('Could not load logo for test print:', e);
    }

    const headerParts: Uint8Array[] = [
      CMD.INIT,
      CMD.ALIGN_CENTER
    ];

    if (logoBytes) {
      headerParts.push(logoBytes, CMD.LINE, CMD.LINE);
    }

    const payload = concatBytes(
      ...headerParts,
      CMD.BOLD_ON,
      CMD.DOUBLE_HEIGHT,
      textToBytes('ON ACTIVE WEAR'), CMD.LINE,
      CMD.NORMAL_SIZE,
      CMD.BOLD_OFF,
      textToBytes('"OWN IT, WEAR IT, FEEL IT"'), CMD.LINE,
      textToBytes(dashedLine(W)), CMD.LINE,
      textToBytes('Printer Test Successful!'), CMD.LINE,
      textToBytes(new Date().toLocaleString()), CMD.LINE,
      textToBytes(dashedLine(W)), CMD.LINE,
      CMD.ALIGN_LEFT,
      textToBytes(formatLine('Left Align', 'Right Align', W)), CMD.LINE,
      textToBytes(dashedLine(W)), CMD.LINE,
      CMD.ALIGN_CENTER,
      textToBytes('Thank you!'), CMD.LINE,
      CMD.FEED_5,
      CMD.PARTIAL_CUT,
    );
    await this.printRaw(payload);
  }

  getPrinterStatus(): PrinterStatus {
    return this.status;
  }
}

export const printerService = new PrinterService();
