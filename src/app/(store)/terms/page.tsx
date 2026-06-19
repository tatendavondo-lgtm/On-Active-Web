import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function TermsPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[#0A0A0A]">
      <Navbar />
      <div className="flex-1 mt-14 sm:mt-20">
        <section className="container mx-auto px-4 py-24 sm:px-10 max-w-4xl">
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-white mb-12 border-b border-white/10 pb-8">
            TERMS & CONDITIONS
          </h1>

          <div className="space-y-12 text-white/70">
            <div>
              <h2 className="text-xl font-black uppercase text-white mb-4">1. Scope and Agreement</h2>
              <p className="font-medium leading-relaxed">
                Welcome to On Active. By browsing or making a purchase on our webstore, you agree to comply with and be bound by these Terms and Conditions. These terms govern the sale of premium athletic apparel dispatched from our main branch in Harare, Zimbabwe.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase text-white mb-4">2. Ordering and WhatsApp Validation</h2>
              <p className="font-medium leading-relaxed mb-4">
                To respect data privacy and facilitate localized payments in Zimbabwe, our checkout utilizes a secure hybrid flow:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-white/50">
                <li>Adding items to the cart and placing an order generates a secure Order Reference (e.g. OA-XXXX).</li>
                <li>You will be dynamically redirected to our official business WhatsApp channel (+263 78 261 0691) to complete the transaction.</li>
                <li>Orders are confirmed only upon sharing valid Proof of Payment (POP) via WhatsApp.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase text-white mb-4">3. Dynamic Distance-Based Delivery</h2>
              <p className="font-medium leading-relaxed mb-4">
                We believe in fair, transparent shipping costs. Delivery fees are computed dynamically based on the straight-line distance from our Harare branch:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-white/50">
                <li><strong>Base Rate:</strong> $2.00 covers deliveries within a 3 km radius from our store.</li>
                <li><strong>Overage Rate:</strong> $0.80 is charged for each additional kilometer beyond the first 3 km.</li>
                <li><strong>GPS Sharing:</strong> Customers must share their precise GPS coordinates at checkout to unlock custom distance pricing. If location permissions are denied, a flat fallback delivery fee of $5.00 applies.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase text-white mb-4">4. Payments and Pricing</h2>
              <p className="font-medium leading-relaxed mb-4">
                We accept payments in USD. Payment methods include:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-white/50">
                <li>EcoCash transfers to our official merchant/merchant line.</li>
                <li>Bank Transfers to our CABS corporate account.</li>
                <li>Card Swipe upon pickup or delivery.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase text-white mb-4">5. Sizing and Exchanges</h2>
              <p className="font-medium leading-relaxed">
                As fit is critical for activewear, please consult our interactive Size Guide on the product page. We offer exchange sizes or store credits within 7 days of delivery, provided the apparel is unworn, unwashed, and retains all original packaging and tags.
              </p>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
