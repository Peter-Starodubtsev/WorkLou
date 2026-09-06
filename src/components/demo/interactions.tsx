"use client";
import { useMemo, useState } from "react";
import { downloadCalendar } from "./calendar";
import "./interactions.css";
import Link from "next/link";
import {
  clientPath,
  firstName,
  initials,
  inferClient,
  escapePattern,
  searchClients,
  seedState,
} from "../../lib/demo/store";
import type { Client, RecordFile } from "../../lib/demo/store";
import { useDemo } from "./context";
import type { ModalState } from "./context";
import { Asset, Button, Dialog, Heading, Rail, TextButton } from "./ui";
export function Composer({
  client,
  expanded = false,
}: {
  client?: Client;
  expanded?: boolean;
}) {
  const { state, dispatch, go, modal } = useDemo(),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState(client?.id || ""),
    [manual, setManual] = useState(false),
    [open, setOpen] = useState(expanded),
    [sources, setSources] = useState<string[]>([]),
    [error, setError] = useState("");
  const inferred = inferClient(state, query),
    c =
      state.clients.find((x) => x.id === selected) ||
      (!manual ? inferred : undefined),
    matches = searchClients(state, query),
    hasTask = query.trim().split(/\s+/).length > 3;
  function run() {
    if (!c) {
      setError("Choose and confirm one client before running.");
      setOpen(true);
      return;
    }
    if (!query.trim()) {
      setError("Describe what you would like done.");
      return;
    }
    dispatch({ type: "run", clientId: c.id, ask: query });
    go(clientPath(c.id, "working"));
  }
  function choose(id: string) {
    const previous = c || inferred,
      next = state.clients.find((x) => x.id === id);
    setSelected(id);
    setManual(true);
    if (previous && next && previous.id !== next.id)
      setQuery((q) =>
        q
          .replace(new RegExp(escapePattern(previous.name), "gi"), next.name)
          .replace(
            new RegExp(`\\b${escapePattern(firstName(previous))}\\b`, "gi"),
            firstName(next),
          ),
      );
    setError("");
  }
  return (
    <div className={`demo-composer ${open ? "expanded" : ""}`}>
      <div className="a2s-ask a2s-matte">
        <Asset name="search" />
        <input
          aria-label="Search a client or describe a task"
          placeholder="Search a client by name or LP number, or say what needs doing"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setQuery("");
              setOpen(false);
            }
            if (e.key === "Enter") {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />
        <button
          className="demo-return"
          aria-label="Review task and confirm client"
          onClick={() => setOpen(!open)}
        >
          <Asset name="return" size={40} />
        </button>
      </div>
      {(query.trim() || open) && (
        <div className="a2s-sheet demo-composer-results">
          {!open && matches.length > 0 && !hasTask ? (
            <>
              {matches.slice(0, 4).map((match) => (
                <div className="demo-search-result" key={match.id}>
                  <div>
                    <div className="demo-search-person">
                      <span className="a2s-avatar">{initials(match.name)}</span>
                      <div>
                        <b>{match.name}</b>
                        <small>
                          {match.ref} · {match.focus} · last contact{" "}
                          {match.last}
                        </small>
                      </div>
                    </div>
                    <small>{match.chips.join(" · ")}</small>
                    <div className="demo-actions">
                      <Button onClick={() => go(clientPath(match.id))}>
                        Open profile
                      </Button>
                      <Button
                        tone="dark"
                        onClick={() => {
                          choose(match.id);
                          setQuery("");
                          setOpen(true);
                        }}
                      >
                        Ask about {firstName(match)}
                      </Button>
                      <Button
                        tone="green"
                        onClick={() =>
                          modal({ type: "note", clientId: match.id })
                        }
                      >
                        New case note
                      </Button>
                    </div>
                  </div>
                  <aside>
                    <p className="demo-label">Linked files</p>
                    {match.files.map((f) => (
                      <Rail
                        key={f.id}
                        title={f.title}
                        detail={f.date}
                        onClick={() =>
                          modal({ type: "file", clientId: match.id, file: f })
                        }
                      />
                    ))}
                    <Link href={clientPath(match.id, "plan")}>
                      Plan · {match.actions.filter((a) => a.done).length} of{" "}
                      {match.actions.length}
                    </Link>
                  </aside>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="demo-confirm">
                {c ? (
                  <>
                    <b>
                      For {c.name} · {c.ref}
                    </b>
                    <TextButton
                      onClick={() => {
                        setSelected("");
                        setManual(true);
                        setOpen(true);
                      }}
                    >
                      Not {firstName(c)}?
                    </TextButton>
                  </>
                ) : (
                  <label>
                    Choose a client{" "}
                    <select
                      aria-label="Confirm client"
                      value={selected}
                      onChange={(e) => choose(e.target.value)}
                    >
                      <option value="">Select one client</option>
                      {state.clients.map((x) => (
                        <option value={x.id} key={x.id}>
                          {x.name} · {x.ref}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              <label className="demo-label" htmlFor="task-description">
                Say what needs doing
              </label>
              <textarea
                id="task-description"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find pet-friendly housing near transport, with no curfew…"
                rows={5}
              />
              <div className="demo-actions">
                {sources.map((s) => (
                  <span className="a2s-chip" key={s}>
                    {s}
                  </span>
                ))}
                <label className="demo-file-label">
                  Attach notes
                  <input
                    type="file"
                    accept=".txt,.md"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 100000) {
                        setError("Use a text note smaller than 100 KB.");
                        return;
                      }
                      const contents = await file.text();
                      setSources((v) => [...v, file.name]);
                      setQuery((v) => `${v}\n${contents}`);
                    }}
                  />
                </label>
                <Button
                  tone="dark"
                  onClick={run}
                  disabled={!c || !query.trim()}
                >
                  Run{c ? ` for ${firstName(c)}` : ""}
                </Button>
                <TextButton
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                    setSelected(client?.id || "");
                    setManual(false);
                  }}
                >
                  Cancel
                </TextButton>
              </div>
              <small>
                Matches one client before anything runs · task and attachments
                stay in this mock preview
              </small>
            </>
          )}
          {error && (
            <p role="alert" className="orange">
              {error}
            </p>
          )}
          {!open && matches.length === 0 && !hasTask && !c && (
            <p>No clients match. Choose a client to run a task.</p>
          )}
        </div>
      )}
    </div>
  );
}
export function Spotlight({ close }: { close: () => void }) {
  const { state, go, modal } = useDemo(),
    [query, setQuery] = useState(""),
    [active, setActive] = useState(0);
  const all = useMemo(
    () => [
      ...state.clients.map((c) => ({
        title: c.name,
        detail: `${c.ref} · ${c.focus}`,
        group: "Clients",
        run: () => go(clientPath(c.id)),
      })),
      ...state.shelters.map((s) => ({
        title: s.name,
        detail: `${s.area} · accommodation · ${s.takes}`,
        group: "Shelters",
        run: () => {
          close();
          modal({ type: "shelter", shelter: s });
        },
      })),
      ...state.clients.flatMap((c) =>
        c.files.map((f) => ({
          title: f.title,
          detail: `${c.name} · ${f.date}`,
          group: "Files",
          run: () => {
            close();
            modal({ type: "file", clientId: c.id, file: f });
          },
        })),
      ),
      ...state.clients.map((c) => ({
        title: `Ask about ${firstName(c)}`,
        detail: c.name,
        group: "Actions",
        run: () => go(`${clientPath(c.id)}?ask=1`),
      })),
      ...[
        ["Today", "/today"],
        ["My clients", "/clients"],
        ["Shelters", "/shelters"],
        ["Plans", "/plans"],
        ["Letters", "/letters"],
        ["Follow-ups", "/follow-ups"],
      ].map(([title, url]) => ({
        title,
        detail: "Open page",
        group: "Pages",
        run: () => go(url),
      })),
    ],
    [state],
  );
  const results = all
      .filter((x) =>
        query
          .toLowerCase()
          .trim()
          .split(/\s+/)
          .every((w) =>
            `${x.title} ${x.detail} ${x.group}`.toLowerCase().includes(w),
          ),
      )
      .slice(0, 18),
    index = Math.min(active, Math.max(0, results.length - 1));
  return (
    <Dialog title="Search Lou’s Place" onClose={close} wide>
      <div className="demo-spot-input">
        <Asset name="search" />
        <input
          autoFocus
          role="combobox"
          aria-label="Search clients, shelters, plans and files"
          aria-expanded="true"
          aria-controls="spot-results"
          aria-activedescendant={results.length ? `spot-${index}` : undefined}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          placeholder="Search a name, shelter, plan or letter"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive(Math.min(index + 1, results.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive(Math.max(0, index - 1));
            }
            if (e.key === "Enter" && results[index]) {
              e.preventDefault();
              results[index].run();
            }
          }}
        />
      </div>
      <div className="demo-spot-results" id="spot-results" role="listbox">
        {results.map((x, i) => (
          <button
            key={`${x.group}-${i}`}
            id={`spot-${i}`}
            role="option"
            aria-selected={index === i}
            className="demo-spot-result"
            onMouseEnter={() => setActive(i)}
            onClick={x.run}
          >
            <span>
              <small>{x.group}</small>
              <b>{x.title}</b>
              <small>{x.detail}</small>
            </span>
            {index === i && <span>Open ↵</span>}
          </button>
        ))}
        {!results.length && (
          <p>No results. Try a client name, LP number, service or page.</p>
        )}
      </div>
      <small>↑ ↓ to choose · Enter to open · Esc to close</small>
    </Dialog>
  );
}
export function DraftReview({
  client,
  text,
  title = "Draft",
  onReviewed,
}: {
  client: Client;
  text: string;
  title?: string;
  onReviewed?: () => void;
}) {
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const current = `${client.id}|${title}|${text}`;
  const reviewed = snapshot === current;
  const hasName = text.toLowerCase().includes(firstName(client).toLowerCase());
  return (
    <section className="demo-draft-review">
      <div className="demo-review-heading">
        <div>
          <b>Another look before you save</b>
          <small>Preview assistant review · local checklist, not live AI</small>
        </div>
        <Button
          onClick={() => {
            setSnapshot(current);
            onReviewed?.();
          }}
        >
          ✧ Check draft
        </Button>
      </div>
      {snapshot !== null && (
        <div aria-live="polite">
          {!reviewed ? (
            <p className="orange">
              Draft changed. Check it again before relying on this review.
            </p>
          ) : (
            <>
              <p className="demo-label">
                Checked against {client.name} · {client.ref}
              </p>
              <ul className="demo-review-checks">
                <li>
                  {text.trim()
                    ? "✓ Draft has content."
                    : "○ Add notes before saving."}
                </li>
                <li>
                  {title.trim()
                    ? "✓ File has a title."
                    : "○ Add a clear title."}
                </li>
                <li>
                  {hasName
                    ? `✓ ${firstName(client)} is named in the draft.`
                    : `○ Confirm this draft is about ${client.name}; the name is missing.`}
                </li>
                {/bed|vacan|availab|shelter|housing|book|capacity/i.test(
                  text,
                ) && (
                  <li>
                    ○ Service capacity is unconfirmed. Check directly before
                    promising a place.
                  </li>
                )}
                <li>
                  ○ Review accuracy, agreed next steps and safe sharing with the
                  client.
                </li>
              </ul>
              <small>
                These checks do not approve the content or contact anyone. You
                decide what happens next.
              </small>
            </>
          )}
        </div>
      )}
    </section>
  );
}
export function Modals({
  value,
  close,
  reset,
}: {
  value: NonNullable<ModalState>;
  close: () => void;
  reset: () => void;
}) {
  const { state, dispatch, notify, go } = useDemo(),
    c = state.clients.find((x) => x.id === value.clientId),
    [text, setText] = useState(
      value.file?.body ||
        (value.type === "letter" && c
          ? `Support letter for ${c.name}\n\n${c.summary}\n\nAgreed plan:\n${c.actions.map((a) => `• ${a.title}`).join("\n")}\n\nHannah Lee · Lou’s Place\nSynthetic preview — not for sending.`
          : ""),
    ),
    [title, setTitle] = useState(
      value.file?.title ||
        (value.type === "letter" ? "Support letter" : "Contact note"),
    ),
    [name, setName] = useState(
      value.type === "edit-client" ? c?.name || "" : "",
    ),
    [focus, setFocus] = useState(
      value.type === "edit-client" ? c?.focus || "" : "",
    ),
    [summary, setSummary] = useState(c?.summary || ""),
    [chips, setChips] = useState(c?.chips.join(", ") || ""),
    [approved, setApproved] = useState(false),
    [savedCallback, setSavedCallback] = useState(false),
    [date, setDate] = useState(() => {
      const next = new Date();
      next.setDate(next.getDate() + 1);
      next.setHours(14, 0, 0, 0);
      return new Date(next.getTime() - next.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    });
  const stamp = () => new Date().toLocaleString("en-AU");
  function save(kind: "note" | "letter" | "message", existing?: RecordFile) {
    if (!c || !text.trim() || !title.trim()) return;
    dispatch({
      type: "file",
      clientId: c.id,
      file: {
        id: existing?.id || crypto.randomUUID(),
        title: title.trim(),
        body: text.trim(),
        kind,
        date: stamp(),
      },
    });
    notify(
      "Saved to the client’s files. Alerts and recent contact are updated.",
    );
    close();
  }
  if (value.type === "reset")
    return (
      <Dialog title="Reset the mock preview?" onClose={close}>
        <p>
          This clears only this browser’s mock notes, plans and choices and
          restores the eight example clients.
        </p>
        <div className="demo-actions">
          <Button tone="dark" onClick={reset}>
            Reset demo
          </Button>
          <Button onClick={close}>Keep my changes</Button>
        </div>
      </Dialog>
    );
  if (value.type === "settings")
    return (
      <Dialog title="Preview settings" onClose={close}>
        <p>Hannah Lee · simulated caseworker</p>
        <p>
          This preview stores synthetic records in this browser. Git contains
          the starter examples; your browser edits are not shared with other
          reviewers.
        </p>
        <p>No account, message, provider call or booking is connected.</p>
        <Link href="/states" onClick={close}>
          Review component states
        </Link>
      </Dialog>
    );
  if (value.type === "new")
    return (
      <Dialog title="Add a new person" onClose={close}>
        <p>
          Start with their name and what they need. You can build the plan
          together.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !focus.trim()) return;
            const id = crypto.randomUUID(),
              base = seedState().clients.find((x) => x.id === "nadia")!;
            const client: Client = {
              ...base,
              id,
              name: name.trim(),
              ref: `LP-${String(248 + state.clients.length).padStart(4, "0")}`,
              focus: focus.trim(),
              stage: "First conversation",
              last: "just now",
              next: "Review together",
              overdue: false,
              waiting: false,
              attention: true,
              summary:
                text.trim() ||
                `${name.trim()} would like support with ${focus.trim()}.`,
              chips: [focus.trim()],
              actions: [],
              suggestions: [focus.trim()],
              files: text.trim()
                ? [
                    {
                      id: crypto.randomUUID(),
                      title: "First conversation",
                      body: text.trim(),
                      kind: "note",
                      date: stamp(),
                    },
                  ]
                : [],
              reviews: [],
              events: ["New mock client created"],
              run: undefined,
            };
            dispatch({ type: "add-client", client });
            go(clientPath(id));
            notify("Person added to My clients and Today.");
          }}
        >
          <label>
            Name
            <input
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First and last name"
            />
          </label>
          <label>
            What do they need?
            <input
              required
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="e.g. Housing, safe phone, support letter"
            />
          </label>
          <label>
            First conversation
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setApproved(false);
              }}
              rows={4}
              placeholder="Notes in their own words"
            />
          </label>
          <div className="demo-actions">
            <Button
              type="submit"
              tone="green"
              disabled={!name.trim() || !focus.trim()}
            >
              Add person
            </Button>
            <Button onClick={close}>Cancel</Button>
          </div>
        </form>
      </Dialog>
    );
  if (value.type === "shelter" && value.shelter) {
    const s = value.shelter;
    return (
      <Dialog title={s.name} onClose={close}>
        <p>{s.area} · synthetic service</p>
        <dl className="demo-facts">
          <dt>Takes</dt>
          <dd>{s.takes}</dd>
          <dt>Beds</dt>
          <dd>
            {s.beds ?? "Unknown"} · {s.checked} · mock confirmation
          </dd>
          <dt>Transport</dt>
          <dd>{s.walk ? s.walk + " min walk to station" : "Referral line"}</dd>
          <dt>Curfew</dt>
          <dd>
            {s.noCurfew
              ? "No curfew"
              : "11 pm · may conflict with night shifts"}
          </dd>
        </dl>
        <p>
          Review suitability with the client. Capacity shown here is a mock
          example.
        </p>
        {c ? (
          <Button
            tone="dark"
            onClick={() => {
              dispatch({ type: "choose", clientId: c.id, shelterId: s.id });
              notify(
                `${s.name} selected for ${firstName(c)}. No booking made.`,
              );
              close();
            }}
          >
            Choose for {firstName(c)}
          </Button>
        ) : (
          <>
            <p>Open a client to make a case-specific choice.</p>
            <Button onClick={() => go("/clients")}>My clients</Button>
          </>
        )}
      </Dialog>
    );
  }
  if (!c)
    return (
      <Dialog title="Choose a client" onClose={close}>
        <p>This action needs a client record.</p>
        <Button onClick={() => go("/clients")}>My clients</Button>
      </Dialog>
    );
  if (value.type === "edit-client")
    return (
      <Dialog title={`Edit ${firstName(c)}’s information`} onClose={close}>
        <p>
          Keep the summary and support needs up to date together. Changes stay
          in this mock case.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !focus.trim()) return;
            dispatch({
              type: "edit-client",
              clientId: c.id,
              changes: {
                name: name.trim(),
                focus: focus.trim(),
                summary: summary.trim(),
                chips: [
                  ...new Set(
                    chips
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  ),
                ],
              },
            });
            notify(
              "Client information updated across the profile, search and My clients.",
            );
            close();
          }}
        >
          <label>
            Name
            <input
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Current focus
            <input
              required
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
            />
          </label>
          <label>
            Summary
            <textarea
              rows={5}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </label>
          <label>
            Support tags
            <input value={chips} onChange={(e) => setChips(e.target.value)} />
            <small>
              Separate tags with commas, for example: Housing, Dog, Safe phone
            </small>
          </label>
          <div className="demo-actions">
            <Button
              tone="green"
              type="submit"
              disabled={!name.trim() || !focus.trim()}
            >
              Save changes
            </Button>
            <Button onClick={close}>Cancel</Button>
          </div>
        </form>
      </Dialog>
    );
  if (value.type === "quick")
    return (
      <Dialog title={`${firstName(c)}’s quick exit plan`} onClose={close}>
        <p>Reviewed together · nothing is sent without her</p>
        {c.quick.map((x) => (
          <div className="demo-plan-row" key={x.id}>
            <Asset name={x.done ? "check" : "ring"} size={16} />
            <div>
              <b>{x.title}</b>
              <small>{x.detail}</small>
            </div>
          </div>
        ))}
        <div className="demo-actions">
          <Button tone="dark" onClick={() => go(clientPath(c.id, "plan"))}>
            Open the plan
          </Button>
          <Button onClick={() => window.print()}>Print to PDF</Button>
          <Button
            onClick={() => {
              dispatch({
                type: "file",
                clientId: c.id,
                file: {
                  id: crypto.randomUUID(),
                  title: "Quick exit plan · simulated message",
                  kind: "message",
                  body: c.quick
                    .map((x) => `${x.title}: ${x.detail}`)
                    .join("\n"),
                  date: stamp(),
                },
              });
              notify(
                "Simulated safe-phone message saved. Nothing transmitted.",
              );
              close();
            }}
          >
            Send to safe phone · simulate
          </Button>
          <Button onClick={close}>Close</Button>
        </div>
      </Dialog>
    );
  if (value.type === "review")
    return (
      <Dialog title={`Review with ${firstName(c)}`} onClose={close}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            dispatch({
              type: "review",
              clientId: c.id,
              text: `${stamp()} · Hannah · ${text.trim()}`,
            });
            notify("Review saved to the plan.");
            close();
          }}
        >
          <label>
            What did you agree together?
            <textarea
              autoFocus
              required
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setApproved(false);
              }}
              rows={4}
            />
          </label>
          <Button type="submit" tone="dark" disabled={!text.trim()}>
            Save review
          </Button>
        </form>
      </Dialog>
    );
  if (value.type === "callback" && savedCallback) {
    const shelter = state.shelters.find((s) => s.id === c.best);
    return (
      <Dialog title="Callback ready in your plan" onClose={close}>
        <div className="demo-review-success" role="status">
          <b>✓ Mock callback saved</b>
          <p>
            {c.name} · {shelter?.name}
            <br />
            {c.callback}
          </p>
        </div>
        <p>
          Next: confirm the time with the service. No invitation or booking has
          been sent.
        </p>
        <div className="demo-actions">
          {shelter && (
            <Button tone="green" onClick={() => downloadCalendar(c, shelter)}>
              Download calendar event
            </Button>
          )}
          <Button onClick={() => go(clientPath(c.id, "referrals"))}>
            View referrals
          </Button>
          <Button onClick={close}>Done</Button>
        </div>
        <small>
          Downloads a private .ics reminder for your calendar. It does not sync
          automatically.
        </small>
      </Dialog>
    );
  }
  if (value.type === "callback")
    return (
      <Dialog title={`Book a callback for ${firstName(c)}`} onClose={close}>
        <p>
          Service:{" "}
          {state.shelters.find((s) => s.id === c.best)?.name ||
            "Choose a service first"}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!c.best || !date) return;
            dispatch({
              type: "callback",
              clientId: c.id,
              date: new Date(date).toLocaleString("en-AU"),
              startsAt: new Date(date).toISOString(),
            });
            notify(
              "Mock callback saved. Today, referrals and the paper trail are updated.",
            );
            setSavedCallback(true);
          }}
        >
          <label>
            Callback date and time
            <input
              type="datetime-local"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <p>Creates a simulated booking only. No provider is contacted.</p>
          <Button type="submit" tone="dark" disabled={!c.best}>
            Confirm mock callback
          </Button>
        </form>
      </Dialog>
    );
  return (
    <Dialog
      title={
        value.type === "file"
          ? value.file?.title || "Client file"
          : value.type === "letter"
            ? `Support letter · ${firstName(c)}`
            : `New case note · ${firstName(c)}`
      }
      onClose={close}
      wide
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(
            value.file?.kind || (value.type === "letter" ? "letter" : "note"),
            value.file,
          );
        }}
      >
        <label>
          Title
          <input
            autoFocus
            value={title}
            required
            onChange={(e) => {
              setTitle(e.target.value);
              setApproved(false);
            }}
          />
        </label>
        <label>
          {value.type === "letter" ? "Review the draft" : "Notes"}
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setApproved(false);
            }}
            rows={10}
            required
            placeholder="What did the client say? What did you agree together?"
          />
        </label>
        <DraftReview client={c} text={text} title={title} />
        {(value.type === "letter" || value.file?.kind === "letter") && (
          <label className="demo-review-approval">
            <input
              type="checkbox"
              checked={approved}
              onChange={(e) => setApproved(e.target.checked)}
            />
            <span>
              I have reviewed the wording and what is appropriate to share with{" "}
              {firstName(c)}.
            </span>
          </label>
        )}
        <small>
          Saved only to {c.name}’s mock file · nothing is transmitted
        </small>
        <div className="demo-actions">
          <Button
            type="submit"
            tone={value.type === "note" ? "green" : "dark"}
            disabled={!text.trim() || !title.trim()}
          >
            Save {value.type === "note" ? "case note" : "draft"}
          </Button>
          {(value.type === "letter" || value.file?.kind === "letter") && (
            <Button
              tone="green"
              disabled={!approved || !text.trim() || !title.trim()}
              onClick={() => {
                const file = {
                  id: value.file?.id || crypto.randomUUID(),
                  title: title.trim(),
                  body: text.trim(),
                  kind: "letter" as const,
                  date: stamp(),
                };
                dispatch({ type: "file", clientId: c.id, file });
                dispatch({
                  type: "file",
                  clientId: c.id,
                  file: {
                    id: crypto.randomUUID(),
                    title: `${title.trim()} · simulated send`,
                    body: `SIMULATED SEND — nothing transmitted. Reviewed by Hannah.\n\n${text.trim()}`,
                    kind: "message",
                    date: stamp(),
                  },
                });
                notify(
                  "Reviewed letter saved and simulated send recorded. Nothing transmitted. Next: check the client's follow-up plan.",
                );
                close();
              }}
            >
              Save &amp; simulate send
            </Button>
          )}
          <Button onClick={close}>Cancel</Button>
        </div>
      </form>
    </Dialog>
  );
}
