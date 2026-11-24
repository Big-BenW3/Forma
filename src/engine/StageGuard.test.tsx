// @vitest-environment jsdom
/**
 * A 3D failure must never take the lesson down: no WebGL shows an explanation,
 * a model that fails to load shows a retry that really retries.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StageGuard, webglSupported } from "./StageGuard";

afterEach(() => vi.restoreAllMocks());

describe("StageGuard", () => {
  it("explains when the device has no WebGL, instead of rendering the scene", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    expect(webglSupported()).toBe(false);
    render(<StageGuard><p>scene</p></StageGuard>);
    expect(screen.getByText("3D is not available on this device")).toBeInTheDocument();
    expect(screen.queryByText("scene")).not.toBeInTheDocument();
  });

  it("renders the scene when WebGL works", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as RenderingContext);
    render(<StageGuard><p>scene</p></StageGuard>);
    expect(screen.getByText("scene")).toBeInTheDocument();
  });

  it("catches a failed model load and retries on request", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as RenderingContext);
    vi.spyOn(console, "error").mockImplementation(() => {});
    let fail = true;
    function Model() {
      if (fail) throw new Error("network");
      return <p>model loaded</p>;
    }
    render(<StageGuard><Model /></StageGuard>);
    expect(screen.getByText("The model did not load")).toBeInTheDocument();
    fail = false;
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByText("model loaded")).toBeInTheDocument();
  });
});
