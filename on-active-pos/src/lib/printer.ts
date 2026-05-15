import type { ReceiptData } from './receipt';

export interface PrinterStatus {
  connected: boolean;
  type: '58mm' | '80mm';
}

class PrinterService {
  private status: PrinterStatus = { connected: false, type: '80mm' };

  async connectPrinter(): Promise<boolean> {
    // In a real app, this would use Web Serial API or Tauri Serial plugin
    console.log('Connecting to thermal printer...');
    this.status.connected = true;
    return true;
  }

  async printReceipt(data: ReceiptData): Promise<void> {
    if (!this.status.connected) {
      const ok = await this.connectPrinter();
      if (!ok) throw new Error('Printer not connected');
    }

    console.log('Printing receipt...', data);
    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async testPrint(): Promise<void> {
    console.log('Test print initiated');
  }

  getPrinterStatus(): PrinterStatus {
    return this.status;
  }
}

export const printerService = new PrinterService();
