import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getSettings } from "@/lib/settings";
import { CheckoutForm } from "./CheckoutForm";

export const metadata = {
  title: 'Checkout | On Active',
};

export default async function CheckoutPage() {
  const settings = await getSettings();

  return (
    <main className="flex min-h-screen flex-col bg-[#0A0A0A]">
      <Navbar />
      <div className="flex-1 w-full mt-14 sm:mt-20">
        <CheckoutForm settings={settings} />
      </div>
      <Footer />
    </main>
  );
}
