import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../../services/adminApi";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const settingsSchema = z.object({
  clientName: z.string().min(1, "Required"),
  workspaceId: z.string().min(1, "Required"),
  supportedLanguages: z.string().min(1, "Required"),
  scoringHot: z.string().min(1, "Required"),
  scoringWarm: z.string().min(1, "Required"),
  scoringCold: z.string().min(1, "Required"),
  waTemplate: z.string().min(1, "Required"),
});

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => adminApi.getSettings(),
  });

  const updateMutation = useMutation({
    mutationFn: adminApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update settings.");
    }
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      clientName: "",
      workspaceId: "",
      supportedLanguages: "",
      scoringHot: "",
      scoringWarm: "",
      scoringCold: "",
      waTemplate: ""
    }
  });

  useEffect(() => {
    if (data?.data) {
      reset(data.data);
    }
  }, [data, reset]);

  const onSubmit = (formData: any) => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="p-6 text-center text-zinc-500 animate-pulse">Loading settings...</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Settings</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">System configuration and integration settings.</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4 bg-zinc-100 dark:bg-[#1A2234]">
          <TabsTrigger value="general" className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#111827] data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 text-zinc-600 dark:text-zinc-400">General</TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#111827] data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 text-zinc-600 dark:text-zinc-400">Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#111827] data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 text-zinc-600 dark:text-zinc-400">Notifications</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#111827] data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 text-zinc-600 dark:text-zinc-400">Security</TabsTrigger>
          <TabsTrigger value="apikeys" className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#111827] data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 text-zinc-600 dark:text-zinc-400">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
              <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/50">
                <CardTitle className="text-lg text-zinc-900 dark:text-zinc-100">Client Information</CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400">Basic info about your workspace</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-700 dark:text-zinc-300">Client Name</Label>
                    <Input {...register("clientName")} className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
                    {errors.clientName && <p className="text-xs text-red-500">{errors.clientName.message as string}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-700 dark:text-zinc-300">Workspace ID</Label>
                    <Input {...register("workspaceId")} disabled className="bg-zinc-100 dark:bg-[#1A2234] text-zinc-500 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
              <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/50">
                <CardTitle className="text-lg text-zinc-900 dark:text-zinc-100">System Configuration</CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400">Core rules and logic for the CRM</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2 max-w-md">
                    <Label className="text-zinc-700 dark:text-zinc-300">Supported Languages</Label>
                    <Input {...register("supportedLanguages")} className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
                     {errors.supportedLanguages && <p className="text-xs text-red-500">{errors.supportedLanguages.message as string}</p>}
                  </div>
                </div>
                
                <Separator className="bg-zinc-200 dark:bg-zinc-800" />
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Scoring Thresholds</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] text-orange-500 font-semibold uppercase tracking-widest">Hot</Label>
                      <Input {...register("scoringHot")} className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] text-yellow-500 font-semibold uppercase tracking-widest">Warm</Label>
                      <Input {...register("scoringWarm")} className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] text-cyan-500 font-semibold uppercase tracking-widest">Cold</Label>
                      <Input {...register("scoringCold")} className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
                    </div>
                  </div>
                </div>

                <Separator className="bg-zinc-200 dark:bg-zinc-800" />

                <div className="space-y-2">
                  <Label className="text-zinc-700 dark:text-zinc-300">WhatsApp Warm Lead Follow-up Template</Label>
                  <Textarea 
                    {...register("waTemplate")}
                    className="resize-none h-24 bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" 
                  />
                  {errors.waTemplate && <p className="text-xs text-red-500">{errors.waTemplate.message as string}</p>}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/50">
              <CardTitle className="text-lg text-zinc-900 dark:text-zinc-100">Your Profile</CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">Manage your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md pt-6">
              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">Full Name</Label>
                <Input defaultValue="Admin User" className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">Email</Label>
                <Input defaultValue="admin@leados.com" disabled className="bg-zinc-100 dark:bg-[#1A2234] text-zinc-500 border-zinc-200 dark:border-zinc-800" />
              </div>
              <Button onClick={() => toast.success("Profile updated")}>Update Profile</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/50">
              <CardTitle className="text-lg text-zinc-900 dark:text-zinc-100">Email Notifications</CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">Choose what alerts you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold text-zinc-900 dark:text-zinc-100">New Lead Alerts</Label>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Receive an email when a Hot lead drops</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Daily Summaries</Label>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Receive a daily breakdown of agent performance</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/50">
              <CardTitle className="text-lg text-zinc-900 dark:text-zinc-100">Security</CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">Keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md pt-6">
              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">Current Password</Label>
                <Input type="password" className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">New Password</Label>
                <Input type="password" className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
              </div>
              <Button onClick={() => toast.success("Password changed")}>Update Password</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apikeys" className="space-y-6">
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111827]">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/50">
              <CardTitle className="text-lg text-zinc-900 dark:text-zinc-100">API Configuration</CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">Manage your third-party integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
               <div className="space-y-2 max-w-2xl">
                 <Label className="text-zinc-700 dark:text-zinc-300">Twilio Account SID</Label>
                 <Input defaultValue="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx" type="password" className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
               </div>
               <div className="space-y-2 max-w-2xl">
                 <Label className="text-zinc-700 dark:text-zinc-300">Twilio Auth Token</Label>
                 <Input defaultValue="****************" type="password" className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
               </div>
               <div className="space-y-2 max-w-2xl">
                 <Label className="text-zinc-700 dark:text-zinc-300">WhatsApp Business API Token</Label>
                 <Input defaultValue="EAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" type="password" className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
               </div>
               <div className="space-y-2 max-w-2xl">
                 <Label className="text-zinc-700 dark:text-zinc-300">Google Gemini API Key</Label>
                 <Input defaultValue="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX" type="password" className="bg-zinc-50 dark:bg-[#0B0F14] border-zinc-200 dark:border-zinc-800" />
               </div>
               <Button onClick={() => toast.success("Keys updated")}>Save API Keys</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
