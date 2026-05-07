export const mockChatResponses = {
  en: {
    greeting: (name: string) => `Hello ${name}, welcome to LeadOS Client Portal. I'm your AI assistant. How can I help you today?`,
    setup: "To start, we'll need to link your existing client database. Our tools integrate with most major CRMs.",
    objection_cost: "I understand pricing is a concern. Our platform guarantees a ROI by automating 15+ hours of manual work every week, letting you focus on bringing in more clients.",
    objection_time: "Getting started takes under 5 minutes. Our onboarding is fully automated.",
    closing: "Perfect. Does it sound like we'd be a good match to help scale your business?",
    fallback: "That's an interesting point. Ultimately, our main goal is to empower partners like yourself to achieve more with less friction. Shall we proceed with setting up your profile?",
  },
  es: {
    greeting: (name: string) => `Hola ${name}, bienvenido a LeadOS Client Portal. Soy tu asistente de IA. ¿Cómo te puedo ayudar hoy?`,
    setup: "Para comenzar, necesitaremos vincular tu base de datos de clientes. Nuestras herramientas se integran con la mayoría de los CRM.",
    objection_cost: "Entiendo que el precio es una preocupación. Nuestra plataforma garantiza un retorno de inversión al automatizar más de 15 horas de trabajo manual, permitiéndote enfocarte en tus clientes.",
    objection_time: "Comenzar toma menos de 5 minutos. Nuestro proceso está completamente automatizado.",
    closing: "Perfecto. ¿Te parece que seríamos una buena opción para escalar tu negocio?",
    fallback: "Es un punto interesante. Nuestro objetivo es empoderar a los socios para lograr más con menos esfuerzo. ¿Procedemos a configurar tu perfil?",
  }
};
