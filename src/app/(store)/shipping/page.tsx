import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function ShippingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[#0A0A0A]">
      <Navbar />
      <div className="flex-1 mt-14 sm:mt-20">
        <section className="container mx-auto px-4 py-24 sm:px-10 max-w-4xl">
          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-white mb-12 border-b border-white/10 pb-8">
            SHIPPING & RETURNS
          </h1>

          <div className="space-y-12 text-white/70">
            <div>
              <h2 className="text-2xl font-black uppercase text-white mb-4">Domestic Delivery</h2>
              <p className="font-medium leading-relaxed mb-4">
                We offer nationwide delivery across Zimbabwe. Orders within Harare are typically delivered within 24-48 hours. Orders to other cities may take 2-4 business days.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-white/50">
                <li>Harare Delivery: $3.00 (Free over $50)</li>
                <li>Nationwide Courier: Calculated at checkout</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-black uppercase text-white mb-4">International Shipping</h2>
              <p className="font-medium leading-relaxed">
                We currently do not offer standard automated international shipping. For bulk international orders or special inquiries, please contact our support team.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black uppercase text-white mb-4">Returns & Exchanges</h2>
              <p className="font-medium leading-relaxed mb-4">
                We stand behind the quality of our gear. If you are not completely satisfied with your purchase, we offer exchanges or store credit within 7 days of delivery, provided the item is unworn with original tags attached.
              </p>
              <p className="text-[#C5A021] text-xs font-bold uppercase tracking-widest">
                Note: Sale items and undergarments are final sale.
              </p>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
