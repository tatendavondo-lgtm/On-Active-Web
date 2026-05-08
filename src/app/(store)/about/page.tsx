import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Image from "next/image";

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[#0A0A0A]">
      <Navbar />
      <div className="flex-1 mt-14 sm:mt-20">
        <section className="relative h-[60vh] w-full overflow-hidden text-white flex items-center">
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/products/TGIS 150.jpg"
              alt="About Background"
              fill
              className="object-cover opacity-30 grayscale"
            />
            <div className="absolute inset-0 bg-neutral-950/60" />
          </div>
          
          <div className="container relative z-10 mx-auto px-4 sm:px-10 text-center">
            <p className="text-[#C5A021] font-black tracking-[0.5em] text-sm mb-4 uppercase">The Vision</p>
            <h1 className="text-5xl font-black uppercase tracking-tighter sm:text-8xl leading-[0.9]">
              REDEFINING <br /> PERFORMANCE.
            </h1>
          </div>
        </section>

        <section className="container mx-auto px-4 py-24 sm:px-10 max-w-4xl text-center space-y-8">
          <p className="text-xl text-white/80 font-medium leading-relaxed">
            At On Active, we engineer premium fitness apparel designed for elite performers. Born in Zimbabwe and built for the world, our mission is to fuse aerospace-grade technical fabrics with unparalleled aesthetic design.
          </p>
          <p className="text-xl text-white/50 font-medium leading-relaxed">
            Every stitch, seam, and contour is calculated to push your limits. We don't just dress athletes; we armor them.
          </p>
          <div className="pt-12">
            <span className="text-[10px] uppercase font-black tracking-[1em] text-[#C5A021]">EST. 2026</span>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
