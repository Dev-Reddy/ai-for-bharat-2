import { z } from "zod";
import { phoneCountryOptions } from "../../../shared/phoneCountryOptions";

export { phoneCountryOptions };

export const leadFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  countryIso: z.string().length(2, "Country is required"),
  countryCode: z.string().regex(/^\+\d{1,4}$/, "Enter a valid country code"),
  mobileNumber: z.string().min(6, "Please enter a valid mobile number").regex(/^\d+$/, "Mobile number should contain only digits"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  address: z.string().optional(),
  preferredLanguage: z.string().optional(),
  preferredLanguageOther: z.string().optional(),
  preferredContactMethod: z.enum(["chat_now", "call_under_5_min"]),
}).superRefine((value, ctx) => {
  if (value.preferredLanguage === "other" && !value.preferredLanguageOther?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please enter your preferred language",
      path: ["preferredLanguageOther"],
    });
  }
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;
