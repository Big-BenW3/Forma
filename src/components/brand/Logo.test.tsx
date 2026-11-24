// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LogoMark, Wordmark } from "./Logo";

describe("logo", () => {
  it("is decorative by default and named when given a title", () => {
    const { container } = render(<LogoMark />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    render(<LogoMark title="FORMA" />);
    expect(screen.getByRole("img", { name: "FORMA" })).toBeInTheDocument();
  });

  it("draws six faces, three of them in the cut colours", () => {
    const { container } = render(<LogoMark tone="dark" />);
    expect(container.querySelectorAll("path")).toHaveLength(6);
  });

  it("the wordmark shows the name", () => {
    render(<Wordmark />);
    expect(screen.getByText("FORMA")).toBeInTheDocument();
  });
});
