'use client';

import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { updateStoreSettings } from '@/app/admin/(hub)/settings/actions';
import toast from 'react-hot-toast';

interface StoreSettingsProps {
  initialSettings: Record<string, string>;
}

export function StoreSettings({ initialSettings }: StoreSettingsProps) {
  const [settings, setSettings] = useState({
    whatsapp_number: initialSettings.whatsapp_number ?? '',
    delivery_fee_usd: initialSettings.delivery_fee_usd ?? '5.00',
    free_delivery_threshold_usd: initialSettings.free_delivery_threshold_usd ?? '150.00',
    ecocash_details: initialSettings.ecocash_details ?? '',
    bank_details: initialSettings.bank_details ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStoreSettings(settings);
      toast.success('Settings saved');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: 'whatsapp_number', label: 'Business WhatsApp', hint: '+263 xxx xxx xxx', type: 'text' },
    { key: 'delivery_fee_usd', label: 'Delivery Fee (USD)', hint: 'Charged per order', type: 'number' },
    { key: 'free_delivery_threshold_usd', label: 'Free Delivery Threshold (USD)', hint: 'Orders above this get free delivery', type: 'number' },
    { key: 'ecocash_details', label: 'EcoCash Payment Instructions', hint: 'Shown at checkout when EcoCash is selected (e.g. Dial *151*2*2*MerchantCode*Amount#)', type: 'text' },
    { key: 'bank_details', label: 'Bank Transfer Instructions', hint: 'Shown at checkout when Bank Transfer is selected (e.g. Bank Name, Account Number)', type: 'text' },
  ] as const;

  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] p-6">
      <h3 className="text-white font-bold text-sm mb-5">Store Settings</h3>
      <div className="space-y-5">
        {fields.map(({ key, label, hint, type }) => (
          <div key={key}>
            <label className="text-[#555] text-[11px] font-bold uppercase tracking-wider block mb-1.5">
              {label}
            </label>
            <input
              type={type}
              value={settings[key]}
              onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
              className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-[6px] px-4 py-2.5 text-white text-sm outline-none focus:border-[#2a2a2a] transition-colors"
            />
            <p className="text-[#444] text-xs mt-1">{hint}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <button
          id="save-settings-btn"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#C5A021] text-black text-sm font-bold rounded-[6px] hover:bg-[#A6861C] disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Settings
        </button>
      </div>
    </div>
  );
}
