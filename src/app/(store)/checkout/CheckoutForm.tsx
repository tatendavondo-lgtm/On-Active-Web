"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useCart } from "@/store/cart";
import { useRouter } from "next/navigation";
import { Loader2, Navigation, Compass, MapPin, Info } from "lucide-react";
import { toast } from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

// Harare fallback coordinates if stores table is empty or query fails
const FALLBACK_STORE_LAT = -17.8142845;
const FALLBACK_STORE_LNG = 31.0334224;

// Haversine formula to compute great-circle distance between two points in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

export function CheckoutForm({ settings }: { settings: any }) {
  const { items, clearCart } = useCart();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ecocash" | "bank">("ecocash");
  const [deliveryOption, setDeliveryOption] = useState<"pickup" | "delivery">("delivery");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [coordsLoading, setCoordsLoading] = useState(false);
  const [coordsError, setCoordsError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [errors, setErrors] = useState({ name: "", phone: "", address: "" });
  
  // Active store branches from DB
  const [storesList, setStoresList] = useState<{ id?: string; name: string; latitude: number; longitude: number }[]>([]);

  useEffect(() => {
    setMounted(true);

    // Fetch active store branches on mount
    async function fetchStores() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("stores")
          .select("id, name, latitude, longitude")
          .eq("is_active", true);

        if (!error && data && data.length > 0) {
          setStoresList(data);
        } else {
          // Default fallback store info
          setStoresList([{
            name: "Harare Main Branch",
            latitude: FALLBACK_STORE_LAT,
            longitude: FALLBACK_STORE_LNG
          }]);
        }
      } catch (err) {
        console.error("Failed to fetch stores coords:", err);
        setStoresList([{
          name: "Harare Main Branch",
          latitude: FALLBACK_STORE_LAT,
          longitude: FALLBACK_STORE_LNG
        }]);
      }
    }

    fetchStores();
  }, []);

  // Use useMemo to find the closest active store to the user
  const closestStore = useMemo(() => {
    if (storesList.length === 0) {
      return { id: undefined, name: "Harare Main Branch", latitude: FALLBACK_STORE_LAT, longitude: FALLBACK_STORE_LNG };
    }
    if (!gpsCoords) return storesList[0];
    
    let closest = storesList[0];
    let minDistance = calculateDistance(gpsCoords.lat, gpsCoords.lng, closest.latitude, closest.longitude);
    
    for (let i = 1; i < storesList.length; i++) {
      const dist = calculateDistance(gpsCoords.lat, gpsCoords.lng, storesList[i].latitude, storesList[i].longitude);
      if (dist < minDistance) {
        minDistance = dist;
        closest = storesList[i];
      }
    }
    return closest;
  }, [storesList, gpsCoords]);

  const storeLat = closestStore?.latitude ?? FALLBACK_STORE_LAT;
  const storeLng = closestStore?.longitude ?? FALLBACK_STORE_LNG;

  // Calculate distance if GPS pinned
  const distanceKm = gpsCoords 
    ? calculateDistance(gpsCoords.lat, gpsCoords.lng, storeLat, storeLng) 
    : null;

  // Pricing: Pickup is FREE.
  // Delivery with GPS: $2 base (up to 3km) + $0.80 per extra km
  // Delivery without GPS: flat $5 fallback fee
  const cartSubtotal = items.reduce((sum, item) => sum + (item.price_usd * item.quantity), 0);
  let deliveryFee = 0;
  if (deliveryOption === "delivery") {
    if (distanceKm !== null) {
      deliveryFee = distanceKm <= 3 ? 2.00 : 2.00 + (distanceKm - 3) * 0.80;
    } else {
      deliveryFee = 5.00; // flat fallback
    }
  }

  const cartTotal = cartSubtotal + deliveryFee;

  const validate = () => {
    let valid = true;
    const newErrors = { name: "", phone: "", address: "" };

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
      valid = false;
    }
    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
      valid = false;
    }
    if (deliveryOption === "delivery" && !form.address.trim()) {
      newErrors.address = "Delivery address is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setCoordsError("Geolocation is not supported by your browser");
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setCoordsLoading(true);
    setCoordsError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setCoordsLoading(false);
        toast.success("GPS Location Pinned! Custom delivery fee calculated.");
      },
      (error) => {
        console.error(error);
        setCoordsLoading(false);
        let msg = "Failed to retrieve location. Please check your browser permissions.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location permission denied. Please enable it in browser settings.";
        }
        setCoordsError(msg);
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const shortDate = dateStr.slice(2); // "YYMMDD"
    const randomSeq = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    const orderRef = `OA-${shortDate}-${randomSeq}`;

    const payload = {
      order_ref: orderRef,
      items: items.map(i => ({
        productId: i.productId,
        variantId: i.variantId,
        name: i.name,
        price: i.price_usd,
        size: i.size,
        color: i.color,
        quantity: i.quantity,
        image: i.image
      })),
      total_usd: cartTotal,
      delivery_fee_usd: deliveryFee,
      payment_method: paymentMethod,
      delivery_option: deliveryOption,
      fulfillment_type: deliveryOption === "pickup" ? "collection" : "delivery",
      customer_name: form.name.trim(),
      customer_phone: form.phone.trim(),
      delivery_address: deliveryOption === "delivery" ? form.address.trim() : "",
      store_id: closestStore?.id || null,
      gps_coords: gpsCoords ? `${gpsCoords.lat},${gpsCoords.lng}` : null
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Failed to place order.");
      
      // WhatsApp message formatting
      let methodText = paymentMethod === 'ecocash' ? 'EcoCash' : paymentMethod === 'bank' ? 'Bank Transfer' : 'Card/Swipe';
      let deliveryText = deliveryOption === 'pickup' ? 'Store Pickup (FREE)' : 'Delivery to Door';
      
      let msg = `Hi On Active! 👋\n\nI want to place an order: ${orderRef}\n*Name*: ${form.name}\n*Phone*: ${form.phone}\n*Method*: ${methodText}\n*Delivery Option*: ${deliveryText}`;
      
      if (deliveryOption === 'delivery') {
        msg += `\n*Address*: ${form.address}`;
        if (gpsCoords && distanceKm !== null) {
          msg += `\n*Distance*: ${distanceKm.toFixed(1)} km`;
          msg += `\n*GPS Location*: https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lng}`;
        }
      }
      
      msg += `\n*Delivery Fee*: $${deliveryFee.toFixed(2)}`;
      msg += `\n*Total*: $${cartTotal.toFixed(2)}`;
      
      const waUrl = `https://wa.me/${settings.whatsapp_number.replace(/\+/g, '')}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');
      
      clearCart();
      router.push(`/order-confirmed?ref=${orderRef}`);
    } catch (err: any) {
      toast.error("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="container mx-auto px-4 py-8 sm:py-16 sm:px-10 max-w-6xl">
      <h1 className="text-3xl font-[900] uppercase tracking-tighter text-white sm:text-5xl border-b border-white/10 pb-8 mb-8">
        SECURE CHECKOUT
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Form */}
        <div className="space-y-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Step 1: Delivery Option */}
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#C5A021]">1. Delivery Option</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeliveryOption("pickup")}
                className={`py-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                  deliveryOption === "pickup" 
                    ? 'bg-[#C5A021] border-[#C5A021] text-black' 
                    : 'bg-[#111] border-white/5 text-white/40 hover:border-white/20'
                }`}
              >
                Store Pickup (FREE)
              </button>
              <button
                type="button"
                onClick={() => setDeliveryOption("delivery")}
                className={`py-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                  deliveryOption === "delivery" 
                    ? 'bg-[#C5A021] border-[#C5A021] text-black' 
                    : 'bg-[#111] border-white/5 text-white/40 hover:border-white/20'
                }`}
              >
                Delivery to Door
              </button>
            </div>

            {/* Step 2: Shipping Details */}
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#C5A021] pt-4">2. Shipping Details</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Full Name</label>
                <input 
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className={`w-full bg-[#111111] border p-4 text-white placeholder-white/30 outline-none transition-colors rounded-xl ${errors.name ? 'border-red-500' : 'border-white/5 focus:border-[#C5A021]'}`}
                  placeholder="YOUR NAME"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1 font-bold">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Phone Number</label>
                <input 
                  value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                  className={`w-full bg-[#111111] border p-4 text-white placeholder-white/30 outline-none transition-colors rounded-xl ${errors.phone ? 'border-red-500' : 'border-white/5 focus:border-[#C5A021]'}`}
                  placeholder="07XX XXX XXX"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1 font-bold">{errors.phone}</p>}
              </div>

              {deliveryOption === "delivery" && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/30">Delivery Address</label>
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={coordsLoading}
                        className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#C5A021] bg-[#C5A021]/5 hover:bg-[#C5A021]/15 px-3 py-1.5 rounded-lg transition-all border border-[#C5A021]/20"
                      >
                        {coordsLoading ? (
                          <>
                            <Loader2 size={10} className="animate-spin" />
                            GETTING GPS...
                          </>
                        ) : (
                          <>
                            <Navigation size={10} />
                            PIN GPS LOCATION
                          </>
                        )}
                      </button>
                    </div>
                    <textarea 
                      value={form.address}
                      onChange={e => setForm({...form, address: e.target.value})}
                      className={`w-full h-24 bg-[#111111] border p-4 text-white placeholder-white/30 outline-none transition-colors rounded-xl resize-none ${errors.address ? 'border-red-500' : 'border-white/5 focus:border-[#C5A021]'}`}
                      placeholder="FULL PHYSICAL ADDRESS OR DIRECTIONS"
                    />
                    {errors.address && <p className="text-red-500 text-xs mt-1 font-bold">{errors.address}</p>}
                  </div>

                  {!gpsCoords && (
                    <div className="flex items-start gap-3 bg-[#111] border border-white/5 p-4 rounded-xl">
                      <Info className="text-white/40 flex-shrink-0 mt-0.5" size={14} />
                      <p className="text-[10px] font-bold text-white/40 leading-relaxed uppercase tracking-wide">
                        Pin your GPS location above to calculate a custom delivery fee based on your distance from our nearest branch! (Fallback flat rate: $5.00)
                      </p>
                    </div>
                  )}

                  {gpsCoords && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 bg-[#C5A021]/10 border border-[#C5A021]/20 p-4 rounded-xl">
                        <MapPin className="text-[#C5A021] flex-shrink-0" size={18} />
                        <div className="flex-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#C5A021]">GPS Location Pinned ✓</p>
                          <p className="text-[9px] font-bold text-[#C5A021]/80 uppercase tracking-widest mt-0.5 font-sans">Branch: {closestStore?.name}</p>
                          <p className="text-[11px] font-bold text-white/60 font-mono mt-0.5">{gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}</p>
                        </div>
                        {distanceKm !== null && (
                          <div className="text-right border-l border-white/10 pl-4">
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/40">DISTANCE</p>
                            <p className="text-lg font-black italic text-white leading-none mt-1">{distanceKm.toFixed(1)} km</p>
                          </div>
                        )}
                      </div>
                      
                      {distanceKm !== null && (
                        <div className="bg-[#111] border border-white/5 p-3 rounded-xl flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-white/40">
                          <span>Delivery Base rate (Up to 3km):</span>
                          <span className="text-white">$2.00</span>
                        </div>
                      )}
                    </div>
                  )}

                  {coordsError && (
                    <p className="text-[10px] font-bold uppercase text-red-400 tracking-wide">{coordsError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Step 3: Payment Method */}
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#C5A021] pt-4">3. Payment Method</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'ecocash', label: 'EcoCash' },
                { id: 'bank', label: 'Transfer' },
                { id: 'card', label: 'Card' }
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`py-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                    paymentMethod === method.id 
                      ? 'bg-[#C5A021] border-[#C5A021] text-black' 
                      : 'bg-[#111] border-white/5 text-white/40 hover:border-white/20'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>

            <div className="bg-[#111] p-6 rounded-xl border border-white/5">
              {paymentMethod === 'ecocash' && (
                <div className="space-y-2">
                  <p className="text-xs font-black text-white uppercase tracking-widest">Dial: *151*1*1*0777123456*Amount#</p>
                  <p className="text-[10px] text-white/40 font-medium">Reference: Use your Order Number.</p>
                </div>
              )}
              {paymentMethod === 'bank' && (
                <div className="space-y-2">
                  <p className="text-xs font-black text-white uppercase tracking-widest">CABS: 1234567890 (On Active)</p>
                  <p className="text-[10px] text-white/40 font-medium">Please send your POP to WhatsApp.</p>
                </div>
              )}
              {paymentMethod === 'card' && (
                <div className="space-y-2">
                  <p className="text-xs font-black text-white uppercase tracking-widest">Swipe at Pickup</p>
                  <p className="text-[10px] text-white/40 font-medium">Pay via swipe when you pick up your items.</p>
                </div>
              )}
            </div>
            
            <button
              disabled={loading}
              type="submit"
              className="w-full flex items-center justify-center bg-white text-black py-6 text-sm font-black uppercase tracking-[0.3em] hover:bg-[#C5A021] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-xl mt-4"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "COMPLETE ORDER"}
            </button>
          </form>
        </div>

        {/* Summary */}
        <div className="bg-[#111111] p-8 border border-white/5 h-fit">
          <h2 className="text-xl font-black uppercase tracking-widest text-white mb-6">Order Summary</h2>
          <div className="space-y-4 mb-6">
            {items.map(item => (
              <div key={`${item.productId}-${item.size}`} className="flex gap-4">
                <div className="relative h-16 w-12 bg-black border border-white/5 flex items-center justify-center">
                  {item.image && item.image !== "/images/placeholder.jpg" ? (
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  ) : (
                    <span className="text-[7px] font-black italic tracking-tighter text-white/20 uppercase">
                      ON ACTIVE
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xs uppercase font-bold text-white/90">{item.name}</h3>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-[#C5A021]">Size: {item.size} x{item.quantity}</p>
                </div>
                <p className="text-sm font-black text-white italic">${(item.price_usd * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-6 space-y-4">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/50">
              <span>Subtotal</span>
              <span>${cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/50">
              <span>Delivery</span>
              <span>
                {deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}
                {distanceKm !== null && deliveryOption === "delivery" && (
                  <span className="text-[10px] text-white/30 lowercase font-medium tracking-normal ml-1">
                    ({distanceKm.toFixed(1)}km distance)
                  </span>
                )}
              </span>
            </div>
            
            <div className="pt-4 border-t border-white/10 flex flex-col items-end">
              <div className="flex justify-between items-end w-full mb-1">
                <span className="text-lg font-black uppercase tracking-widest text-white">Total</span>
                <span className="text-2xl font-black italic text-white">${cartTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
