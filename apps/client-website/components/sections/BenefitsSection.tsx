import Image from "next/image";
import { cn } from "@/lib/utils";

const benefits = [
  {
    title: "Fast Onboarding",
    description: "Get set up in under 5 minutes with our automated KYC process.",
    image: "https://picsum.photos/seed/fastonboarding/600/400",
  },
  {
    title: "Premium Support",
    description: "24/7 dedicated support via chat, email, or voice channels.",
    image: "https://picsum.photos/seed/premiumsupport/600/400",
  },
  {
    title: "Bank-grade Security",
    description: "Your data is protected with enterprise-level encryption.",
    image: "https://picsum.photos/seed/bankgrade/600/400",
  },
  {
    title: "Verified Partners",
    description: "Join an exclusive network of top-tier financial professionals.",
    image: "https://picsum.photos/seed/verifiedpartners/600/400",
  },
];

export function BenefitsSection() {
  return (
    <section id="benefits" className="py-24 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-semibold tracking-tight text-[#0f172a] sm:text-4xl">
            Why partner with us?
          </h2>
          <p className="mt-4 text-lg text-[#475569] max-w-2xl mx-auto">
            We provide the infrastructure so you can focus on building relationships and growing your business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, i) => (
             <div 
              key={i}
              className={cn(
                "group relative overflow-hidden rounded-[24px] bg-white flex flex-col h-full",
                "border border-gray-100",
                "hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 ease-out"
              )}
            >
              <div className="relative h-48 w-full overflow-hidden shrink-0 bg-gray-100">
                <Image
                  src={benefit.image}
                  alt={benefit.title}
                  fill
                  referrerPolicy="no-referrer"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              <div className="p-8 flex flex-col flex-grow bg-[#f8fafc] group-hover:bg-white transition-colors duration-300">
                <h3 className="text-xl font-semibold text-[#0f172a] mb-3">
                  {benefit.title}
                </h3>
                <p className="text-[15px] text-[#475569] leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
