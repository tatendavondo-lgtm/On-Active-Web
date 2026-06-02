import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function PrivacyPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[#0A0A0A]">
      <Navbar />
      <div className="flex-1 mt-14 sm:mt-20">
        <section className="container mx-auto px-4 py-24 sm:px-10 max-w-4xl">
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-white mb-12 border-b border-white/10 pb-8">
            PRIVACY POLICY
          </h1>

          <div className="space-y-12 text-white/70">
            <div>
              <h2 className="text-xl font-black uppercase text-white mb-4">1. Data Privacy and POTRAZ Compliance</h2>
              <p className="font-medium leading-relaxed">
                At On Active, we respect your right to privacy. In alignment with the Postal and Telecommunications Regulatory Authority of Zimbabwe (POTRAZ) guidelines and data protection regulations, we are dedicated to protecting your personal information. We gather and process only the essential data needed to complete your purchases and fulfill delivery logistics.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase text-white mb-4">2. Pre-Release Account Notice</h2>
              <p className="font-medium leading-relaxed">
                To prevent unauthorized storage of personal profile data, **we do not currently support persistent customer account registrations or logins**. All customer login features are labeled as "Coming Soon" and remain inactive. Checkout operations are processed on an individual, order-by-order basis.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase text-white mb-4">3. Geolocation and Coordinate Security</h2>
              <p className="font-medium leading-relaxed mb-4">
                To provide accurate dynamic shipping rates and secure door-to-door delivery, we collect your latitude and longitude coordinates through the browser Geolocation API:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-white/50">
                <li>Coordinates are gathered only when you explicitly click the "Pin GPS Location" button during checkout.</li>
                <li>This data is stored securely in our order table to compute your delivery distance.</li>
                <li>Your coordinates are shared with our logistics team as a Google Maps navigation link via WhatsApp to ensure correct routing. We do not use GPS data for background tracking or advertising.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase text-white mb-4">4. Supabase Data Protection</h2>
              <p className="font-medium leading-relaxed">
                All order transactions, including customer names, phone numbers, delivery addresses, and purchasing histories, are transmitted using secure SSL encryption and stored in our database, backed by Row Level Security (RLS). This ensures that only authorized administrators and dispatch personnel can view your order data.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase text-white mb-4">5. Your Rights</h2>
              <p className="font-medium leading-relaxed">
                You have the right to request access to the information we hold about you or request that we delete your previous order log records from our delivery databases. For any data inquiries or removal requests, please reach out to us via our official business channels.
              </p>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
