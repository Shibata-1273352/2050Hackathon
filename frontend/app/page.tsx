/*
 * Day 1: design token smoke page.
 * Day 3 で 7 シーン UI に全置換する。今は §10.1 の semantic 色が
 * @theme inline 経由で出ていることを目視確認するためだけのページ。
 */

const VOICES = [
  { id: "gyosei", label: "行政", token: "agent-gyosei" },
  { id: "kankyo", label: "環境", token: "agent-kankyo" },
  { id: "kigyo", label: "企業", token: "agent-kigyo" },
  { id: "seikatsu", label: "生活者", token: "agent-seikatsu" },
  { id: "jisedai", label: "次世代", token: "agent-jisedai" },
] as const;

const SOURCES = ["official", "open", "hypothesis", "claim"] as const;

export default function Page() {
  return (
    <main className="min-h-screen px-12 py-16">
      <header className="mb-12">
        <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-agent-seikatsu)]">
          Day 1 — Token Smoke
        </p>
        <h1 className="font-serif text-2xl font-bold mt-2">
          Mirai Forge / ぐんま未来工房
        </h1>
        <p className="text-sm text-[var(--color-fg-muted)] mt-2">
          §10.1 semantic tokens. 7 シーン UI は Day 3 で本実装。
        </p>
      </header>

      <section className="mb-12">
        <h2 className="text-xs uppercase tracking-[0.2em] text-[var(--color-fg-muted)] mb-4">
          5視点 (Five Voices)
        </h2>
        <div className="grid grid-cols-5 gap-4">
          {VOICES.map((v) => (
            <div
              key={v.id}
              className="rounded border border-[var(--color-line)] p-4"
            >
              <div
                className="h-16 rounded mb-3"
                style={{ background: `var(--color-${v.token})` }}
              />
              <div className="text-sm font-semibold">{v.label}</div>
              <div className="text-xs text-[var(--color-fg-muted)] mt-1">
                {v.token}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xs uppercase tracking-[0.2em] text-[var(--color-fg-muted)] mb-4">
          Letter / Draft v1 / Draft v2
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded border border-[var(--color-line)] p-4">
            <div
              className="h-16 rounded mb-3"
              style={{ background: "var(--color-letter-future)" }}
            />
            <div className="text-sm font-serif font-semibold">
              2050年からの手紙
            </div>
            <div className="text-xs text-[var(--color-fg-muted)] mt-1">
              letter.future
            </div>
          </div>
          <div className="rounded border border-[var(--color-line)] p-4">
            <div
              className="h-16 rounded mb-3"
              style={{ background: "var(--color-draft-v1)" }}
            />
            <div className="text-sm font-semibold">草案 v1</div>
            <div className="text-xs text-[var(--color-fg-muted)] mt-1">
              draft.v1
            </div>
          </div>
          <div className="rounded border border-[var(--color-line)] p-4">
            <div
              className="h-16 rounded mb-3"
              style={{ background: "var(--color-draft-v2)" }}
            />
            <div className="text-sm font-semibold">草案 v2</div>
            <div className="text-xs text-[var(--color-fg-muted)] mt-1">
              draft.v2
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-[0.2em] text-[var(--color-fg-muted)] mb-4">
          Source 4-tier badges
        </h2>
        <div className="flex flex-wrap gap-3">
          {SOURCES.map((k) => (
            <span
              key={k}
              className="inline-flex items-center rounded border px-2 py-1 text-xs font-semibold tracking-[0.08em]"
              style={{
                color: `var(--color-source-${k})`,
                borderColor: `var(--color-source-${k})`,
              }}
            >
              source.{k}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
