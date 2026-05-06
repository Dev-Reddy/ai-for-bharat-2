import { Globe2, Mic, GitMerge, Brain, BarChart3, Fingerprint, MessageCircle, ShieldQuestion, Database } from "lucide-react";

export default function Features() {
  const features = [
    { icon: <Globe2 className="w-5 h-5 text-accent-primary" />, title: "Multilingual Conversations", desc: "Support English, Hindi, and Hinglish so leads can speak in the language they are comfortable with." },
    { icon: <Mic className="w-5 h-5 text-accent-primary" />, title: "Voice and Chat Ready", desc: "Run the same qualification flow through website chat or voice using a provider like Vapi." },
    { icon: <GitMerge className="w-5 h-5 text-accent-primary" />, title: "Structured Sales Flow", desc: "Guide every conversation through greeting, hook, pitch, discovery, objection handling, qualification, and close." },
    { icon: <ShieldQuestion className="w-5 h-5 text-accent-primary" />, title: "Objection Intelligence", desc: "Detect and handle the five required objections naturally, then extract them for RM review and analytics." },
    { icon: <Brain className="w-5 h-5 text-accent-primary" />, title: "Explainable Scoring", desc: "Score every lead across readiness, engagement, and fit, with clear reasoning behind Hot, Warm, or Cold classification." },
    { icon: <Fingerprint className="w-5 h-5 text-accent-primary" />, title: "RM Handoff Brief", desc: "Give RMs the context they need before calling: transcript, score reason, objections, key signals, and suggested opening line." },
    { icon: <MessageCircle className="w-5 h-5 text-accent-primary" />, title: "WhatsApp Follow-up Links", desc: "Generate ready-to-send WhatsApp follow-up messages for Warm leads using wa.me links." },
    { icon: <BarChart3 className="w-5 h-5 text-accent-primary" />, title: "Admin Analytics", desc: "Track funnel health, language distribution, objection trends, RM performance, and follow-up status." },
    { icon: <Database className="w-5 h-5 text-accent-primary" />, title: "Knowledge Base Powered", desc: "Use approved scripts, FAQs, onboarding guides, and objection guides to keep AI responses grounded." },
  ];

  return (
    <section id="features" className="w-full bg-white py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-display font-medium text-text-1 tracking-tight mb-4">
            Everything needed for AI-led qualification and <span className="text-text-2">human-led conversion.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {features.map((feature, idx) => (
            <div key={idx} className="flex flex-col space-y-3 p-6 rounded-2xl bg-bg-soft border border-border-subtle hover:border-accent-primary/30 hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm mb-2">
                {feature.icon}
              </div>
              <h3 className="text-base font-bold text-text-1">{feature.title}</h3>
              <p className="text-sm text-text-2 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
