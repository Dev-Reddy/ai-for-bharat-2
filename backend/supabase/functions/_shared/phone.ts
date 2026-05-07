import { z } from "npm:zod@^4.1.12";
import { parsePhoneNumberFromString } from "npm:libphonenumber-js";
import type { CountryCode } from "npm:libphonenumber-js";

export const phoneInputSchema = z.object({
  countryIso: z.string().trim().length(2),
  countryCode: z.string().trim().regex(/^\+\d{1,4}$/),
  mobileNumber: z.string().trim().min(4),
});

export type PhoneInput = z.infer<typeof phoneInputSchema>;

export function normalizeMobileNumber({
  countryIso,
  countryCode,
  mobileNumber,
}: PhoneInput) {
  const normalizedCountryIso = countryIso.trim().toUpperCase() as CountryCode;
  const cleanCountryCode = countryCode.trim();

  if (mobileNumber.includes("+")) {
    throw new Error("Enter only the mobile number without country code.");
  }

  const cleanMobileNumber = mobileNumber
    .trim()
    .replace(/\s+/g, "")
    .replace(/-/g, "")
    .replace(/\(/g, "")
    .replace(/\)/g, "");

  if (!/^\d+$/.test(cleanMobileNumber)) {
    throw new Error("Mobile number should contain only digits.");
  }

  const fullNumber = `${cleanCountryCode}${cleanMobileNumber}`;
  const phone = parsePhoneNumberFromString(fullNumber, normalizedCountryIso);

  if (!phone || !phone.isValid()) {
    throw new Error("Please enter a valid mobile number.");
  }

  return {
    countryIso: normalizedCountryIso,
    countryCode: phone.countryCallingCode ? `+${phone.countryCallingCode}` : cleanCountryCode,
    mobileNumberRaw: cleanMobileNumber,
    phoneE164: phone.number,
  };
}
