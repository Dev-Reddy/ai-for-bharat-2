import { Laptop, BarChart3, Users } from "lucide-react";

export default function ProductPreview() {
  const previews = [
    {
      title: "Client Experience",
      desc: "Embeddable forms and drop-in widgets that feel natively integrated into your brand.",
      icon: <Laptop className="w-5 h-5 text-text-1" />,
      color: "bg-white"
    },
    {
      title: "Admin Portal",
      desc: "Complete oversight. Configure routing logic, adjust scoring weights, and monitor pipeline health.",
      icon: <BarChart3 className="w-5 h-5 text-accent-primary" />,
      color: "glass-card border-blue-100"
    },
    {
      title: "RM Workspace",
      desc: "A focused interface for Relationship Managers to see deep intel on their routed leads before dialing.",
      icon: <Users className="w-5 h-5 text-accent-secondary" />,
      color: "bg-slate-50 border-border-subtle"
    }
  ];

  return (
    <section id="product-preview" className="w-full py-24 sm:py-32 border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-16">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-accent-primary mb-3">The Platform</h2>
          <p className="text-3xl sm:text-4xl font-display font-bold text-text-1 tracking-tight leading-[1.1]">
            One system. Three perspectives.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {previews.map((preview, idx) => (
            <div 
              key={idx} 
              className={`relative rounded-3xl p-8 border overflow-hidden flex flex-col h-80 transition-base hover:-translate-y-1 hover:shadow-xl ${preview.color}`}
            >
              <div className="flex items-center space-x-3 mb-6 relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm border border-border-subtle`}>
                  {preview.icon}
                </div>
                <h3 className={`text-lg font-bold text-text-1`}>{preview.title}</h3>
              </div>
              
              <p className={`text-sm leading-relaxed relative z-10 text-text-2`}>
                {preview.desc}
              </p>

              {/* Abstract decorative graphic for the "preview" look */}
              <div className="mt-auto pt-8 relative z-10">
                <div className={`w-full h-32 rounded-t-xl border-t border-x bg-white border-border-subtle shadow-[0_-5px_15px_rgba(0,0,0,0.02)] overflow-hidden`}>
                  <div className={`w-full h-8 flex items-center px-4 space-x-2 border-b border-border-subtle bg-bg-soft`}>
                    <div className={`w-2 h-2 rounded-full bg-border-subtle`}></div>
                    <div className={`w-2 h-2 rounded-full bg-border-subtle`}></div>
                    <div className={`w-2 h-2 rounded-full bg-border-subtle`}></div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className={`h-2 rounded w-1/3 bg-bg-soft`}></div>
                    <div className={`h-2 rounded w-3/4 bg-bg-soft`}></div>
                    <div className={`h-2 rounded w-1/2 bg-bg-soft`}></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
