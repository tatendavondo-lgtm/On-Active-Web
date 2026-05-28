'use client';

import { useState } from 'react';
import { Loader2, Store, Edit2, Plus, X, Phone, MapPin, Navigation, Compass, Check, AlertCircle } from 'lucide-react';
import { addStore, updateStore, toggleStoreStatus } from '@/app/admin/(hub)/settings/actions';
import toast from 'react-hot-toast';

interface StoreBranch {
  id: string;
  name: string;
  code: string;
  address: string;
  latitude: number;
  longitude: number;
  geofence_radius_meters: number;
  phone?: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
}

interface BranchManagementProps {
  initialStores: StoreBranch[];
}

export function BranchManagement({ initialStores }: BranchManagementProps) {
  const [branches, setBranches] = useState<StoreBranch[]>(initialStores);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    name: '',
    code: '',
    address: '',
    latitude: '',
    longitude: '',
    geofenceRadiusMeters: '20',
    phone: '',
    timezone: 'Africa/Harare',
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const resetForm = () => {
    setForm({
      name: '',
      code: '',
      address: '',
      latitude: '',
      longitude: '',
      geofenceRadiusMeters: '20',
      phone: '',
      timezone: 'Africa/Harare',
    });
    setEditingId(null);
  };

  const handleEdit = (branch: StoreBranch) => {
    setEditingId(branch.id);
    setForm({
      name: branch.name,
      code: branch.code,
      address: branch.address,
      latitude: String(branch.latitude),
      longitude: String(branch.longitude),
      geofenceRadiusMeters: String(branch.geofence_radius_meters),
      phone: branch.phone || '',
      timezone: branch.timezone,
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm(f => ({
          ...f,
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
        }));
        setGpsLoading(false);
        toast.success('Coordinates retrieved from your current GPS location!');
      },
      (error) => {
        console.error(error);
        setGpsLoading(false);
        toast.error('Failed to get location. Please allow location access in your browser.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.code.trim() || !form.address.trim()) {
      toast.error('Branch Name, Code, and Address are required');
      return;
    }

    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    const radius = parseInt(form.geofenceRadiusMeters);

    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Valid Latitude and Longitude coordinates are required');
      return;
    }

    if (isNaN(radius) || radius <= 0) {
      toast.error('Valid Geofence radius is required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        const updated = await updateStore(editingId, {
          name: form.name,
          code: form.code,
          address: form.address,
          latitude: lat,
          longitude: lng,
          geofenceRadiusMeters: radius,
          phone: form.phone,
          timezone: form.timezone,
        });
        setBranches(prev => prev.map(b => b.id === editingId ? updated : b));
        toast.success('Branch updated successfully');
      } else {
        const created = await addStore({
          name: form.name,
          code: form.code,
          address: form.address,
          latitude: lat,
          longitude: lng,
          geofenceRadiusMeters: radius,
          phone: form.phone,
          timezone: form.timezone,
        });
        setBranches(prev => [...prev, created]);
        toast.success(`Branch "${form.name}" created successfully`);
      }
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentActive: boolean) => {
    try {
      const updated = await toggleStoreStatus(id, !currentActive);
      setBranches(prev => prev.map(b => b.id === id ? updated : b));
      toast.success(updated.is_active ? 'Branch activated' : 'Branch deactivated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle branch status');
    }
  };

  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-[8px] p-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Store size={16} className="text-[#C5A021]" />
          <h3 className="text-white font-bold text-sm">Branch Store Locations</h3>
        </div>
        {editingId && (
          <button onClick={resetForm} className="text-[10px] font-bold uppercase text-red-500 flex items-center gap-1 hover:underline">
            <X size={12} /> Cancel Edit
          </button>
        )}
      </div>
      <p className="text-[#444] text-xs mb-6">
        {editingId ? `Currently editing ${form.name}` : 'Manage physical store branches, their coordinates, phone numbers, and POS login geofence settings.'}
      </p>

      {/* Form */}
      <div className={`space-y-4 mb-8 p-4 bg-[#0a0a0a] border rounded-[6px] transition-colors ${editingId ? 'border-[#C5A021]/30' : 'border-[#1a1a1a]'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="text-[#444] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Branch Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Harare Main Store"
              className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-[6px] px-3 py-2 text-white text-sm outline-none focus:border-[#2a2a2a]"
            />
          </div>
          <div>
            <label className="text-[#444] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Short Code</label>
            <input
              type="text"
              maxLength={4}
              value={form.code}
              onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))}
              placeholder="HRE"
              className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-[6px] px-3 py-2 text-white text-sm outline-none focus:border-[#2a2a2a] uppercase"
            />
          </div>
        </div>

        <div>
          <label className="text-[#444] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Physical Address</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
            placeholder="123 Samora Machel Ave, Harare, Zimbabwe"
            className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-[6px] px-3 py-2 text-white text-sm outline-none focus:border-[#2a2a2a]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[#444] text-[10px] font-bold uppercase tracking-wider block">Latitude</label>
              <button
                onClick={handleGetLocation}
                disabled={gpsLoading}
                className="text-[9px] font-bold uppercase text-[#C5A021] hover:underline flex items-center gap-0.5"
              >
                {gpsLoading ? <Loader2 size={10} className="animate-spin" /> : <Navigation size={10} />}
                GPS
              </button>
            </div>
            <input
              type="text"
              value={form.latitude}
              onChange={(e) => setForm(f => ({ ...f, latitude: e.target.value }))}
              placeholder="-17.825167"
              className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-[6px] px-3 py-2 text-white text-sm outline-none focus:border-[#2a2a2a]"
            />
          </div>
          <div>
            <label className="text-[#444] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Longitude</label>
            <input
              type="text"
              value={form.longitude}
              onChange={(e) => setForm(f => ({ ...f, longitude: e.target.value }))}
              placeholder="31.053139"
              className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-[6px] px-3 py-2 text-white text-sm outline-none focus:border-[#2a2a2a]"
            />
          </div>
          <div>
            <label className="text-[#444] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Geofence Radius (meters)</label>
            <input
              type="number"
              value={form.geofenceRadiusMeters}
              onChange={(e) => setForm(f => ({ ...f, geofenceRadiusMeters: e.target.value }))}
              placeholder="20"
              className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-[6px] px-3 py-2 text-white text-sm outline-none focus:border-[#2a2a2a]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[#444] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Phone Number (Optional)</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+263 24 2123456"
              className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-[6px] px-3 py-2 text-white text-sm outline-none focus:border-[#2a2a2a]"
            />
          </div>
          <div>
            <label className="text-[#444] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Timezone</label>
            <select
              value={form.timezone}
              onChange={(e) => setForm(f => ({ ...f, timezone: e.target.value }))}
              className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-[6px] px-3 py-2.5 text-white text-sm outline-none focus:border-[#2a2a2a]"
            >
              <option value="Africa/Harare">Harare (GMT+2)</option>
              <option value="Africa/Johannesburg">Johannesburg (GMT+2)</option>
              <option value="UTC">UTC (GMT+0)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#C5A021] text-black text-xs font-black uppercase tracking-wider rounded-[6px] hover:bg-[#A6861C] disabled:opacity-50 transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                {editingId ? 'Update Branch' : 'Add Branch'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {branches.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-[#1f1f1f] rounded-[6px]">
            <AlertCircle className="mx-auto text-[#444] mb-2" size={24} />
            <p className="text-white text-xs font-bold uppercase tracking-wider">No branches registered</p>
            <p className="text-[#444] text-[10px] mt-0.5">Use the form above to add your first branch location</p>
          </div>
        ) : (
          branches.map((branch) => (
            <div
              key={branch.id}
              className={`p-4 bg-[#0a0a0a] border rounded-[6px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                branch.is_active ? 'border-[#1f1f1f]' : 'border-dashed border-red-950/40 opacity-60'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-sm tracking-tight">{branch.name}</span>
                  <span className="bg-[#1a1a1a] text-[#C5A021] text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase">
                    {branch.code}
                  </span>
                  {!branch.is_active && (
                    <span className="bg-red-950/20 text-red-400 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[#555] text-xs">
                  <MapPin size={12} className="text-[#C5A021]/60" />
                  <span className="text-[#666] font-medium">{branch.address}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-[#444] pt-0.5">
                  <span className="flex items-center gap-1">
                    <Compass size={10} className="text-[#C5A021]/40" />
                    Lat: {branch.latitude.toFixed(6)}, Lng: {branch.longitude.toFixed(6)}
                  </span>
                  <span>•</span>
                  <span>Geofence: {branch.geofence_radius_meters}m</span>
                  {branch.phone && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Phone size={10} className="text-[#C5A021]/40" />
                        {branch.phone}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end sm:justify-start">
                <button
                  onClick={() => handleEdit(branch)}
                  className="p-2 bg-[#141414] hover:bg-[#1f1f1f] text-white hover:text-[#C5A021] rounded-[6px] border border-[#1f1f1f] transition-all"
                  title="Edit Branch"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={() => handleToggleStatus(branch.id, branch.is_active)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-[6px] border transition-all ${
                    branch.is_active
                      ? 'bg-red-950/10 border-red-950/30 text-red-400 hover:bg-red-950/35'
                      : 'bg-green-950/10 border-green-950/30 text-green-400 hover:bg-green-950/35'
                  }`}
                >
                  {branch.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
