import { z } from "zod";

export const leadFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  address: z.string().optional(),
  preferredLanguage: z.string().optional(),
  preferredContactMethod: z.enum(["chat_now", "call_under_5_min"]),
  whatsappConsent: z.boolean().optional(),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;
