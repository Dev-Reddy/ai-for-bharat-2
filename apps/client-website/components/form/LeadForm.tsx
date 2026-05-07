'use client';

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadFormSchema, LeadFormValues, phoneCountryOptions } from "./lead-schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface LeadFormProps {
  onSubmitSuccess: (data: LeadFormValues) => void;
  isLoading: boolean;
}

export function LeadForm({ onSubmitSuccess, isLoading }: LeadFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, control } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      countryIso: "IN",
      countryCode: "+91",
      mobileNumber: "",
      preferredLanguage: "english",
      preferredLanguageOther: "",
      preferredContactMethod: "chat_now",
    }
  });

  const preferredLanguage = useWatch({ control, name: "preferredLanguage" });
  const preferredContactMethod = useWatch({ control, name: "preferredContactMethod" });
  const countryIso = useWatch({ control, name: "countryIso" });
  const countryCode = useWatch({ control, name: "countryCode" });

  const onSubmit = (data: LeadFormValues) => {
    onSubmitSuccess(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full max-w-xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
          <Input id="name" placeholder="John Doe" disabled={isLoading} {...register("name")} className="rounded-xl border-gray-200 focus-visible:ring-[#0ea5e9] bg-white h-11" />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="countryIso">Country <span className="text-red-500">*</span></Label>
          <select
            id="countryIso"
            disabled={isLoading}
            value={countryIso}
            onChange={(event) => {
              const next = phoneCountryOptions.find((option) => option.iso === event.target.value) ?? phoneCountryOptions[0];
              setValue("countryIso", next.iso, { shouldValidate: true });
              setValue("countryCode", next.code, { shouldValidate: true });
            }}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]"
          >
            {phoneCountryOptions.map((option) => (
              <option key={option.iso} value={option.iso}>
                {option.label}
              </option>
            ))}
          </select>
          <input type="hidden" value={countryIso} {...register("countryIso")} />
          {errors.countryIso && <p className="text-sm text-red-500">{errors.countryIso.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="mobileNumber">Mobile Number <span className="text-red-500">*</span></Label>
          <div className="flex gap-3">
            <Input
              value={countryCode}
              readOnly
              tabIndex={-1}
              className="w-28 rounded-xl border-gray-200 bg-slate-50 text-slate-600 h-11"
            />
            <input type="hidden" value={countryCode} {...register("countryCode")} />
            <Input id="mobileNumber" type="tel" placeholder="9876543210" disabled={isLoading} {...register("mobileNumber")} className="flex-1 rounded-xl border-gray-200 focus-visible:ring-[#0ea5e9] bg-white h-11" />
          </div>
          {errors.countryCode && <p className="text-sm text-red-500">{errors.countryCode.message}</p>}
          {errors.mobileNumber && <p className="text-sm text-red-500">{errors.mobileNumber.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" type="email" placeholder="john@example.com" disabled={isLoading} {...register("email")} className="rounded-xl border-gray-200 focus-visible:ring-[#0ea5e9] bg-white h-11" />
        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" placeholder="Mumbai, Maharashtra" disabled={isLoading} {...register("address")} className="rounded-xl border-gray-200 focus-visible:ring-[#0ea5e9] bg-white h-11" />
      </div>

      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h3 className="text-lg font-medium text-[#0f172a]">Preferences</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label>Preferred Language</Label>
            <RadioGroup disabled={isLoading} value={preferredLanguage} onValueChange={(val) => setValue("preferredLanguage", val)} className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="english" id="lang-en" />
                <Label htmlFor="lang-en" className="font-normal cursor-pointer">English</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hindi" id="lang-hi" />
                <Label htmlFor="lang-hi" className="font-normal cursor-pointer">Hindi</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hinglish" id="lang-hinglish" />
                <Label htmlFor="lang-hinglish" className="font-normal cursor-pointer">Hinglish</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="lang-other" />
                <Label htmlFor="lang-other" className="font-normal cursor-pointer">Others</Label>
              </div>
            </RadioGroup>
            {preferredLanguage === "other" ? (
              <div className="space-y-2">
                <Input
                  placeholder="Enter preferred language"
                  disabled={isLoading}
                  {...register("preferredLanguageOther")}
                  className="rounded-xl border-gray-200 focus-visible:ring-[#0ea5e9] bg-white h-11"
                />
                {errors.preferredLanguageOther && <p className="text-sm text-red-500">{errors.preferredLanguageOther.message}</p>}
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <Label>Preferred Contact Channel</Label>
            <RadioGroup disabled={isLoading} value={preferredContactMethod} onValueChange={(val) => setValue("preferredContactMethod", val as any)} className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="chat_now" id="chan-chat" />
                <Label htmlFor="chan-chat" className="font-normal cursor-pointer">Chat now</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="call_under_5_min" id="chan-voice" />
                <Label htmlFor="chan-voice" className="font-normal cursor-pointer">Call in under 5 minutes</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full h-12 text-base font-semibold rounded-xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white shadow-[0_4px_14px_0_rgba(14,165,233,0.39)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.23)] hover:-translate-y-0.5 transition-all duration-200"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          "Continue to Conversation"
        )}
      </Button>
    </form>
  );
}
