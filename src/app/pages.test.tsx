// @vitest-environment jsdom
/** Simple pages that read the registry: they must list whatever disciplines exist. */
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { allDisciplines, lessonsOf } from "@/content/registry";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }), usePathname: () => "/" }));
vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ accounts: false }), { status: 200 })));

describe("welcome page", () => {
  it("offers the first lesson of every discipline", async () => {
    const { default: WelcomePage } = await import("./welcome/page");
    render(<WelcomePage />);
    for (const d of allDisciplines) {
      const first = lessonsOf(d)[0];
      const link = screen.getByRole("link", { name: new RegExp(d.name) });
      expect(link).toHaveAttribute("href", `/learn/${d.id}/${first.id}`);
      expect(within(link).getByText(`Start: ${first.title}`)).toBeInTheDocument();
    }
  });
});

describe("404 page", () => {
  it("says what happened and links back to the lessons", async () => {
    const { default: NotFound } = await import("./not-found");
    render(<NotFound />);
    expect(screen.getByRole("heading", { name: "That page is not here" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse lessons" })).toHaveAttribute("href", "/home");
  });
});
