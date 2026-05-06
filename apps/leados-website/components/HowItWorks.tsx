export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Lead Capture",
      desc: "Leads enter from a website form, campaign, CSV upload, or API. The system stores profile details, language preference, channel preference, and WhatsApp consent."
    },
    {
      num: "02",
      title: "AI Conversation",
      desc: "The AI starts a chat or voice conversation, confirms the language, explains the offer, and follows a structured sales flow."
    },
    {
      num: "03",
      title: "Objection Handling",
      desc: "The agent handles concerns like existing broker, low contact count, client support, trust, and call later using approved knowledge and conversation context."
    },
    {
      num: "04",
      title: "Scoring and Qualification",
      desc: "After the conversation, LeadOS scores readiness, engagement, and fit to classify the lead as Hot, Warm, or Cold."
    },
    {
      num: "05",
      title: "Routing",
      desc: "Hot leads are assigned to RMs, Warm leads receive WhatsApp follow-up links, and Cold leads are closed or kept low priority."
    },
    {
      num: "06",
      title: "RM Handoff",
      desc: "The RM receives the full lead brief: summary, transcript, score reason, objections, next action, and suggested opening line."
    }
  ];

  return (
    <section id="how-it-works" className="w-full bg-bg-soft py-24 sm:py-32 rounded-t-[2.5rem] md:rounded-t-[4rem] relative overflow-hidden border-t border-border-subtle">
      <div className="absolute top-0 right-0 right-[-10%] w-[50%] h-[50%] opacity-20 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.4)_0%,rgba(0,0,0,0)_60%)] blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
         <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="max-w-2xl text-left">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-medium tracking-tight leading-[1.1] text-text-1">
                From lead capture to RM handoff.<br/> <span className="text-text-2">In one flow.</span>
              </h2>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 relative">
            {steps.map((step, idx) => (
              <div key={idx} className="relative group">
                <span className="block font-display text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-slate-300 to-transparent mb-4">
                  {step.num}
                </span>
                <h3 className="text-lg font-bold mb-3 text-text-1 group-hover:text-accent-secondary transition-colors">{step.title}</h3>
                <p className="text-sm text-text-2 leading-relaxed">{step.desc}</p>
              </div>
            ))}
         </div>
      </div>
    </section>
  );
}
