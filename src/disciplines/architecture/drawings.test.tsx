// @vitest-environment jsdom
/**
 * The architecture drawings: the plan is a working control (rooms are buttons
 * that select in 3D), and all three projections are generated from house.ts.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { FURNITURE, OPENINGS, ROOMS, roomNetArea } from "@/content/disciplines/architecture/house";
import { useWorkspace } from "@/engine/store";
import { lesson, manifest, resetStores } from "@/test/fixtures";
import { Dim } from "./drawing";
import { PlanBlock } from "./PlanView";
import { ElevationBlock, SectionBlock } from "./ProjectionViews";

const house = lesson("architecture", "examine_a_house");
const m = manifest("architecture_house");
const planBlock = { type: "custom" as const, renderer: "plan" };

beforeEach(resetStores);

describe("floor plan", () => {
  it("shows every room as a labelled button with its area", () => {
    render(<PlanBlock lesson={house} manifest={m} block={planBlock} />);
    const plan = screen.getByRole("group", { name: /ground floor plan/i });
    for (const r of ROOMS) expect(within(plan).getByRole("button", { name: `${r.name}, ${roomNetArea(r)} square metres` })).toBeInTheDocument();
    expect(within(plan).getByText("GROUND FLOOR PLAN")).toBeInTheDocument();
  });

  it("clicking a room selects it in the workspace (and so in 3D)", async () => {
    render(<PlanBlock lesson={house} manifest={m} block={planBlock} />);
    await userEvent.click(screen.getByRole("button", { name: /^Kitchen,/ }));
    expect(useWorkspace.getState().selectedId).toBe("room_kitchen");
    expect(screen.getByRole("button", { name: /^Kitchen,/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("rooms work from the keyboard", () => {
    render(<PlanBlock lesson={house} manifest={m} block={planBlock} />);
    const bath = screen.getByRole("button", { name: /^Bathroom,/ });
    bath.focus();
    fireEvent.keyDown(bath, { key: "Enter" });
    expect(useWorkspace.getState().selectedId).toBe("room_bathroom");
  });

  it("takes the roof off so the selected room can be seen", async () => {
    render(<PlanBlock lesson={house} manifest={m} block={planBlock} />);
    expect(useWorkspace.getState().layerStep).toBe(0);
    await userEvent.click(screen.getByRole("button", { name: /^Hall,/ }));
    expect(useWorkspace.getState().layerStep).toBeGreaterThanOrEqual(1);
  });

  it("draws every furniture item, grid bubbles 1-4 and A-D, and the section line", () => {
    const { container } = render(<PlanBlock lesson={house} manifest={m} block={planBlock} />);
    const furniture = container.querySelectorAll("g[transform^='translate'] > *");
    expect(furniture.length).toBeGreaterThanOrEqual(FURNITURE.length);
    for (const g of ["1", "2", "3", "4", "A", "B", "C", "D"]) expect(within(container).getAllByText(g).length).toBeGreaterThan(0);
    expect(within(container).getAllByText("A").length).toBeGreaterThanOrEqual(3); // grid A plus both section arrows
  });

  it("dimensions the overall size in millimetres", () => {
    render(<PlanBlock lesson={house} manifest={m} block={planBlock} />);
    expect(screen.getByText("12000")).toBeInTheDocument();
    expect(screen.getByText("9000")).toBeInTheDocument();
  });
});

describe("elevation and section", () => {
  it("the south elevation shows every front opening, levels and its title", () => {
    const { container } = render(<ElevationBlock />);
    expect(screen.getByText("SOUTH ELEVATION")).toBeInTheDocument();
    for (const l of ["FFL", "EAVES", "RIDGE"]) expect(screen.getByText(new RegExp(`^${l}`))).toBeInTheDocument();
    const front = OPENINGS.filter((o) => o.wall === "ext_s");
    // each window is a glazed rect, the door a panelled one
    expect(container.querySelectorAll("rect[fill='#e3eef4']").length).toBe(front.filter((o) => o.kind === "window").length);
    expect(container.querySelectorAll("rect[fill='#cfe0d9']").length).toBe(front.filter((o) => o.kind === "door").length);
  });

  it("the section names the rooms it passes through and shows heights", () => {
    render(<SectionBlock />);
    expect(screen.getByText("SECTION A-A")).toBeInTheDocument();
    for (const r of ["BATHROOM", "HALL", "LIVING AND DINING"]) expect(screen.getByText(r)).toBeInTheDocument();
    expect(screen.getByText(/^CEILING/)).toBeInTheDocument();
  });
});

describe("dimension strings", () => {
  it("print the length in millimetres", () => {
    render(<svg><Dim a={[0, 0]} b={[3.25, 0]} at={-1} /></svg>);
    expect(screen.getByText("3250")).toBeInTheDocument();
  });
});
