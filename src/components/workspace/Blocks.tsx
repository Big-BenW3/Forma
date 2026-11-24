"use client";
/**
 * Renders reference-tab content blocks. This is a plain mapping from the
 * block types in the content schema to markup; it has no idea which
 * discipline the blocks belong to. `custom` blocks are handed to the
 * discipline adapter.
 */
import type { Block, Lesson, Manifest } from "@/content/schema";
import type { DisciplineAdapter } from "@/disciplines/types";

export function Blocks({
  blocks,
  lesson,
  manifest,
  adapter,
}: {
  blocks: Block[];
  lesson: Lesson;
  manifest: Manifest | null;
  adapter: DisciplineAdapter;
}) {
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "paragraph":
            return (
              <p key={i} className="text-[13px] leading-[1.55] text-ink-2">
                {b.text}
              </p>
            );
          case "bullets":
            return (
              <ul key={i} className="flex flex-col gap-2">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2.5 text-[13px] leading-[1.45] text-ink-2">
                    <span className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-[1px] bg-teal" />
                    <span>{it.text}</span>
                  </li>
                ))}
              </ul>
            );
          case "facts":
            return (
              <dl key={i} className="grid grid-cols-2 gap-2">
                {b.items.map((f, j) => (
                  <div key={j} className="rounded-[6px] border border-line bg-surface-raised px-2.5 py-2">
                    <dt className="micro !text-[9px]">{f.label}</dt>
                    <dd className="mt-0.5 font-mono text-[12px] leading-snug text-ink">{f.value}</dd>
                  </div>
                ))}
              </dl>
            );
          case "table":
            return (
              <div key={i} className="overflow-hidden rounded-[6px] border border-line">
                {b.caption && <div className="micro border-b border-line px-2.5 py-1.5">{b.caption}</div>}
                <table className="w-full border-collapse text-left text-[12px]">
                  <thead>
                    <tr>
                      {b.head.map((h, j) => (
                        <th key={j} className="micro border-b border-line bg-surface-raised px-2.5 py-1.5 !text-[9px]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => {
                      const color = r.group ? manifest?.groups[r.group]?.color : undefined;
                      return (
                        <tr key={j} className="border-b border-line last:border-0">
                          {r.cells.map((c, k) => (
                            <td key={k} className="px-2.5 py-1.5 align-top leading-snug text-ink-2">
                              {k === 0 ? (
                                <span className="flex items-center gap-2 font-mono text-[11.5px] text-ink">
                                  {color && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />}
                                  {c}
                                </span>
                              ) : (
                                c
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          case "code":
            return (
              <pre key={i} className="thin-scroll overflow-auto rounded-[6px] border border-line bg-surface-raised p-3 font-mono text-[11.5px] leading-[1.6] text-ink">
                <code>{b.code}</code>
              </pre>
            );
          case "steps":
            return (
              <ol key={i} className="flex flex-col gap-2">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2.5 text-[13px] leading-[1.45] text-ink-2">
                    <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border border-line-strong font-mono text-[10.5px] text-ink">
                      {j + 1}
                    </span>
                    <span>{it}</span>
                  </li>
                ))}
              </ol>
            );
          case "custom": {
            const R = adapter.blocks?.[b.renderer];
            return R ? <R key={i} lesson={lesson} manifest={manifest!} block={b} /> : null;
          }
        }
      })}
    </div>
  );
}
