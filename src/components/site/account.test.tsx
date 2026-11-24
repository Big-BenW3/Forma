// @vitest-environment jsdom
/**
 * Accounts in the UI: what the header, the sign-in form and the progress note do
 * when accounts are switched off, when the student is signed out, and signed in.
 * The auth client and fetch are faked; the components are real.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams("next=/learn/medicine/the_cell"),
}));

const auth = {
  getSession: vi.fn(),
  signIn: { email: vi.fn() },
  signUp: { email: vi.fn() },
  signOut: vi.fn(async () => ({})),
};
vi.mock("@/lib/auth-client", () => ({ authClient: auth }));

/** Fresh modules per test: the account state is a module-level store. */
async function load(accounts: boolean, user: { name: string } | null = null) {
  vi.resetModules();
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ accounts }), { status: 200 })));
  auth.getSession.mockResolvedValue({ data: user ? { user: { id: "u1", email: "a@b.co", ...user } } : null });
  const [{ AccountMenu }, { AuthForm }, { ProgressNote }] = await Promise.all([import("./AccountMenu"), import("./AuthForm"), import("./HomeView")]);
  return { AccountMenu, AuthForm, ProgressNote };
}

beforeEach(() => {
  push.mockReset();
  auth.getSession.mockReset();
  auth.signIn.email.mockReset();
  auth.signUp.email.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

describe("accounts switched off", () => {
  it("the header shows no sign-in, the form explains, and progress stays in the browser", async () => {
    const { AccountMenu, AuthForm, ProgressNote } = await load(false);
    render(<><AccountMenu /><AuthForm mode="signin" /><ProgressNote /></>);
    expect(await screen.findByText(/accounts are not switched on/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
    expect(screen.getByText("Saved in this browser.")).toBeInTheDocument();
    expect(auth.getSession).not.toHaveBeenCalled(); // no pointless session request
  });
});

describe("signed out", () => {
  it("the header offers Sign in and the note suggests it", async () => {
    const { AccountMenu, ProgressNote } = await load(true);
    render(<><AccountMenu /><ProgressNote /></>);
    expect(await screen.findByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/signin");
    expect(screen.getByText(/Sign in to keep it across devices/)).toBeInTheDocument();
  });

  it("rejects a short password before calling the server", async () => {
    const { AuthForm } = await load(true);
    render(<AuthForm mode="signup" />);
    const submit = await screen.findByRole("button", { name: "Create account" });
    await waitFor(() => expect(submit).toBeEnabled());
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText(/^Password/), "short");
    // the browser's own minLength check would stop a real submit; test our check directly
    screen.getByLabelText(/^Password/).removeAttribute("minLength");
    await userEvent.click(submit);
    expect(await screen.findByRole("alert")).toHaveTextContent(/at least 8 characters/);
    expect(auth.signUp.email).not.toHaveBeenCalled();
  });

  it("a failed sign-in does not reveal whether the email exists", async () => {
    auth.signIn.email.mockResolvedValue({ error: { message: "User not found" } });
    const { AuthForm } = await load(true);
    render(<AuthForm mode="signin" />);
    const submit = await screen.findByRole("button", { name: "Sign in" });
    await waitFor(() => expect(submit).toBeEnabled());
    await userEvent.type(screen.getByLabelText("Email"), "nobody@example.com");
    await userEvent.type(screen.getByLabelText(/^Password/), "long-enough-1");
    await userEvent.click(submit);
    expect(await screen.findByRole("alert")).toHaveTextContent("That email and password do not match.");
    expect(push).not.toHaveBeenCalled();
  });

  it("a successful sign-in returns to the page the student came from", async () => {
    auth.signIn.email.mockResolvedValue({ data: {} });
    const { AuthForm } = await load(true);
    render(<AuthForm mode="signin" />);
    const submit = await screen.findByRole("button", { name: "Sign in" });
    await waitFor(() => expect(submit).toBeEnabled());
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText(/^Password/), "long-enough-1");
    await userEvent.click(submit);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/learn/medicine/the_cell"));
  });

  it("sign-up goes to the welcome page", async () => {
    auth.signUp.email.mockResolvedValue({ data: {} });
    const { AuthForm } = await load(true);
    render(<AuthForm mode="signup" />);
    const submit = await screen.findByRole("button", { name: "Create account" });
    await waitFor(() => expect(submit).toBeEnabled());
    await userEvent.type(screen.getByLabelText("Name"), "Ada");
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText(/^Password/), "long-enough-1");
    await userEvent.click(submit);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/welcome"));
    expect(auth.signUp.email).toHaveBeenCalledWith({ email: "ada@example.com", password: "long-enough-1", name: "Ada" });
  });
});

describe("signed in", () => {
  it("the header shows the name and signs out; the note says progress follows the account", async () => {
    const { AccountMenu, ProgressNote } = await load(true, { name: "Ada Lovelace" });
    render(<><AccountMenu /><ProgressNote /></>);
    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText(/Saved to your account/)).toBeInTheDocument();
    auth.getSession.mockResolvedValue({ data: null });
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(auth.signOut).toHaveBeenCalled();
    expect(await screen.findByRole("link", { name: "Sign in" })).toBeInTheDocument();
  });
});
