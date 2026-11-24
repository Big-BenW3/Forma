// @vitest-environment jsdom
/**
 * The "Find it" practice, driven the way a student drives it: start, then answer
 * each prompt by selecting a part (a click in 3D or in the parts list both end up
 * as a workspace selection, which is what we set here).
 */
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAdapter } from "@/disciplines/registry";
import { useWorkspace } from "@/engine/store";
import { usePractice } from "@/engine/practice";
import { getDiscipline } from "@/content/registry";
import { lesson, resetStores } from "@/test/fixtures";
import { Practice, useSnapshot, useVerdict } from "./ContextPanel";

const cell = lesson("medicine", "the_cell");
const rounds = (cell.practice.params as { rounds: Array<{ prompt: string; answer: string }> }).rounds;

function Harness() {
  const snapshot = useSnapshot("medicine/the_cell");
  const verdict = useVerdict(cell, snapshot);
  return <Practice discipline={getDiscipline("medicine")!} lesson={cell} verdict={verdict} snapshot={snapshot} adapter={getAdapter("medicine")} complete={verdict.passed} next={null} />;
}

beforeEach(() => {
  resetStores();
  usePractice.getState().start("medicine/the_cell");
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

const pick = (id: string) =>
  act(() => {
    useWorkspace.getState().select(id);
  });

describe("identify practice", () => {
  it("starts with labels off and shows the first prompt", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: /start/i }));
    expect(useWorkspace.getState().labels).toBe(false);
    expect(screen.getByText(`Round 1 of ${rounds.length}`)).toBeInTheDocument();
    expect(screen.getByText(rounds[0].prompt)).toBeInTheDocument();
  });

  it("a wrong pick says so and stays on the round; a right pick moves on", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: /start/i }));
    const wrong = cell.parts.find((p) => p.id !== rounds[0].answer)!.id;
    pick(wrong);
    expect(screen.getByText("Not quite. Try again.")).toBeInTheDocument();
    expect(screen.getByText(`Round 1 of ${rounds.length}`)).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTime(500)); // selection clears for the next answer
    pick(rounds[0].answer);
    expect(screen.getByText("Correct.")).toBeInTheDocument();
    expect(screen.getByText(`Round 2 of ${rounds.length}`)).toBeInTheDocument();
  });

  it("finishing every round completes the lesson and turns labels back on", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: /start/i }));
    for (const r of rounds) {
      pick(r.answer);
      await act(async () => vi.advanceTimersByTime(500));
    }
    expect(screen.getByText("Lesson complete")).toBeInTheDocument();
    expect(screen.getByText(`${rounds.length}/${rounds.length}`)).toBeInTheDocument();
    expect(useWorkspace.getState().labels).toBe(true);
  });
});
