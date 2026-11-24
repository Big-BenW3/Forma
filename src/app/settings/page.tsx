import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { SettingsView } from "@/components/site/SettingsView";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="paper min-h-screen">
      <SiteHeader current="/settings" />
      <main className="mx-auto w-full max-w-[640px] px-5 pt-6 sm:px-8">
        <h1 className="text-[28px] font-extrabold tracking-tight">Settings</h1>
        <SettingsView />
      </main>
      <SiteFooter />
    </div>
  );
}
