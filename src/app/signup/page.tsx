import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";
import { AuthForm } from "@/components/site/AuthForm";

export const metadata: Metadata = { title: "Create your account" };

export default function Page() {
  return (
    <div className="paper min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[420px] px-5 pt-10 sm:px-8">
        <h1 className="text-[28px] font-extrabold tracking-tight">Create your account</h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">Free. It saves your progress, and nothing else changes: every lesson works without one.</p>
        {/* useSearchParams needs a Suspense boundary for static rendering */}
        <Suspense>
          <AuthForm mode="signup" />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
