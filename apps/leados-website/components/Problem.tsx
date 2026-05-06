import { Clock, Users, Languages, FileWarning, AlertCircle } from "lucide-react";

export default function Problem() {
  const problems = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Leads go cold",
      description: "After-hours and campaign leads often sit untouched until an RM manually works through the queue."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "RMs get overloaded",
      description: "A human RM can only handle one conversation at a time, creating backlog during lead spikes."
    },
    {
      icon: <Languages className="w-6 h-6" />,
      title: "Language mismatch hurts trust",
      description: "Leads who prefer Hindi or Hinglish may disengage when approached in formal English."
    },
    {
      icon: <FileWarning className="w-6 h-6" />,
      title: "Handoffs lack context",
      description: "RMs often receive only a name and phone number, not the objections, intent signals, transcript, or next best action."
    },
    {
      icon: <AlertCircle className="w-6 h-6" />,
      title: "Objections are handled inconsistently",
      description: "The same concern can be answered differently by different sales users, reducing conversion quality."
    }
  ];

  return (
    <section id="problem" className="w-full bg-bg-soft py-24 sm:py-32 border-y border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl text-left mb-16">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-accent-primary mb-3">The Problem</h2>
          <p className="text-3xl sm:text-4xl font-display font-bold text-text-1 tracking-tight leading-snug mb-4">
            Lead conversion breaks before the RM even gets involved.
          </p>
          <p className="text-lg text-text-2 leading-relaxed">
            Campaigns generate interest, but slow response times, language mismatch, and shallow handoffs cause many leads to go cold before a relationship manager can act.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((problem, idx) => (
            <div 
              key={idx} 
              className="glass-card rounded-2xl p-8 transition-base hover:-translate-y-1 hover:shadow-xl group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-accent-primary group-hover:text-white transition-colors text-accent-primary">
                {problem.icon}
              </div>
              <h3 className="text-lg font-bold text-text-1 mb-2">{problem.title}</h3>
              <p className="text-text-2 text-sm leading-relaxed">{problem.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
