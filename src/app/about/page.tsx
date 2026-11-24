import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site/SiteHeader";

export const metadata: Metadata = { title: "About" };

const H = ({ children }: { children: React.ReactNode }) => <h2 className="mt-9 text-[18px] font-extrabold tracking-tight">{children}</h2>;
const P = ({ children }: { children: React.ReactNode }) => <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">{children}</p>;

export default function AboutPage() {
  return (
    <div className="paper min-h-screen">
      <SiteHeader current="/about" />
      <main className="mx-auto w-full max-w-[680px] px-5 pt-6 sm:px-8">
        <h1 className="text-[30px] font-extrabold tracking-tight">About FORMA</h1>
        <P>
          FORMA teaches by letting you take things apart: a cell, a skeleton, a circuit board, a house, a computer. Every part of every model is a named
          object you can tap.
        </P>

        <H>About the models</H>
        <P>
          Every 3D model in this version was built for FORMA from code, not scanned and not downloaded. Parts are placed where they belong and sized in
          proportion, then simplified so they load fast on a phone. They are teaching models: they leave out detail, and where one shape stands for many
          (both femurs as one part, for example) the lesson says so.
        </P>
        <P>
          Do not use them for clinical decisions, structural design or electrical design. Sizes and facts in the cards are typical ranges and are meant to
          orient a learner, not to replace a textbook or a datasheet.
        </P>

        <H>Model credits</H>
        <P>No third-party 3D assets are used in this version, so there are no licences to attribute. If that changes, each model will be listed here with its author, source and licence.</P>

        <H>Your progress</H>
        <P>
          Lessons are free. Without an account your progress stays in this browser only. With an account it is saved to the server, which re-checks each
          practice using the same rules your browser used before it records a completion.
        </P>
      </main>
      <SiteFooter />
    </div>
  );
}
