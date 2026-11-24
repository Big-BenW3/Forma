"use client";
/** First line of /welcome: uses the signed-in name when there is one. */
import { useAccount } from "@/lib/useAccount";

export function WelcomeGreeting() {
  const { user } = useAccount();
  const first = user?.name?.split(" ")[0];
  return <h1 className="text-[30px] font-extrabold tracking-tight">{first ? `Welcome, ${first}.` : "Welcome."}</h1>;
}
