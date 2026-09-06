"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Sheet } from "../a2/Sheet";
import { MAYA, MY_CLIENTS, PLAN } from "../../lib/a2-mock";
import {
  clientPath,
  firstName,
  filterClients,
  initials,
} from "../../lib/demo/store";
import type { Client } from "../../lib/demo/store";
import { useDemo } from "./context";
import {
  Asset,
  Button,
  TextButton,
  Heading,
  QueueRow,
  Rail,
  Dialog,
} from "./ui";
import { Composer, DraftReview } from "./interactions";
import "./dashboard.css";
export function Today() {
  const { state, modal } = useDemo(),
    [reviewId, setReviewId] = useState<string | null>(null),
    attention = state.clients.filter((c) => c.attention),
    running = state.clients.filter((c) => c.run?.status === "working"),
    letters = state.clients.flatMap((c) =>
      c.files.filter((f) => f.kind === "letter").map((f) => ({ c, f })),
    );
  return (
    <>
      <Heading
        title="Today at Lou’s"
        sub={`Sunday 6 September · ${attention.length} need attention · ${running.length} running`}
      />
      <Composer />
      <div className="a2s-grid">
        <Sheet title={`Needs attention · ${attention.length}`}>
          <ul className="demo-rows">
            {attention.map((c) => (
              <QueueRow
                key={c.id}
                title={c.name}
                detail={
                  c.id === "maya"
                    ? "Housing follow-up · Harbour House callback"
                    : c.focus
                }
                meta={c.overdue ? "Overdue" : c.next}
                tone={c.overdue ? "orange" : ""}
                onClick={() => setReviewId(c.id)}
              />
            ))}
          </ul>
          {!attention.length && (
            <p className="demo-empty">
              Nothing needs your attention. You’re up to date.
            </p>
          )}
          {running.map((c) => (
            <Link
              key={c.id}
              href={clientPath(c.id, "working")}
              className="a2s-matte demo-running"
            >
              <Asset name="spinner" size={16} />
              <b>Finding housing for {firstName(c)}</b>
              <small>awaiting your review</small>
              <u>Open</u>
            </Link>
          ))}
          <p className="demo-label">Follow-ups due</p>
          <ul className="demo-rows">
            {state.clients
              .filter(
                (c) => c.waiting && (c.overdue || c.next.includes("day 5")),
              )
              .map((c) => (
                <QueueRow
                  key={c.id}
                  title={`${c.stage} · ${firstName(c)}`}
                  detail={c.focus}
                  meta={c.overdue ? "Overdue" : "Send follow-up"}
                  tone={c.overdue ? "orange" : ""}
                  onClick={() => setReviewId(c.id)}
                />
              ))}
          </ul>
          <div className="demo-actions">
            <Link href="/clients?filter=Overdue">All overdue</Link>
            <Link href="/clients?filter=Waiting%20on%20service">
              Waiting on service
            </Link>
          </div>
        </Sheet>
        <aside>
          <Sheet
            title="Shelter beds today"
            note="Mock capacity · source and check time shown for review."
            foot={<Link href="/shelters">All shelters</Link>}
          >
            {state.shelters.slice(0, 4).map((s) => (
              <Rail
                key={s.id}
                title={s.name}
                meta={
                  s.beds === null
                    ? "unknown"
                    : `${s.beds} bed${s.beds === 1 ? "" : "s"}`
                }
                detail={s.checked}
                onClick={() => modal({ type: "shelter", shelter: s })}
              />
            ))}
          </Sheet>
          <Sheet
            title={`Letters to write · ${letters.length}`}
            foot={<Link href="/letters">All letters</Link>}
          >
            {letters.map(({ c, f }) => (
              <Rail
                key={f.id}
                title={f.title}
                meta="Draft"
                detail={`for ${firstName(c)} · from her plan`}
                onClick={() => modal({ type: "file", clientId: c.id, file: f })}
              />
            ))}
          </Sheet>
        </aside>
      </div>
      {reviewId && state.clients.find((c) => c.id === reviewId) && (
        <AttentionReview
          key={reviewId}
          c={state.clients.find((c) => c.id === reviewId)!}
          onClose={() => setReviewId(null)}
        />
      )}
    </>
  );
}
function AttentionReview({ c, onClose }: { c: Client; onClose: () => void }) {
  const { dispatch, notify } = useDemo();
  const draftId = `follow-up-draft-${c.id}`;
  const saved = c.files.find((f) => f.id === draftId);
  const [draft, setDraft] = useState(
    saved?.body ||
      `Hello, I’m following up on ${c.name}’s request for ${c.focus.toLowerCase()}. Could you confirm the current status and the next step? Please let us know if you need anything further. Thank you, Hannah · Lou’s Place.`,
  );
  const [savedDraft, setSavedDraft] = useState(false);
  const save = () => {
    dispatch({
      type: "file",
      clientId: c.id,
      file: {
        id: draftId,
        title: "Follow-up draft · for review",
        kind: "message",
        body: draft.trim(),
        date: new Date().toLocaleDateString("en-AU"),
      },
    });
    setSavedDraft(true);
    notify("Follow-up draft saved. Nothing sent.");
  };
  return (
    <Dialog title={`Review · ${c.name}`} onClose={onClose} wide>
      <div className="dashboard-review-context">
        <span className="dashboard-status">Ready for review</span>
        <span>
          {c.ref} · {c.stage}
        </span>
      </div>
      <p>
        {c.focus} · <b>{c.overdue ? "Overdue" : c.next}</b>
      </p>
      <p className="dashboard-review-hint">
        A starter follow-up is ready. Check the recipient, consent and details
        before using it. Stay here to review, or open the full client record.
      </p>
      <label className="dashboard-draft">
        Follow-up draft
        <textarea
          rows={6}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setSavedDraft(false);
          }}
        />
      </label>
      <div className="demo-actions">
        <Button tone="dark" disabled={!draft.trim()} onClick={save}>
          Save draft
        </Button>
        <Link href={clientPath(c.id)}>Open client profile</Link>
      </div>
      <DraftReview client={c} text={draft} title="Follow-up draft" />
      {savedDraft && (
        <p role="status">
          Draft saved in {firstName(c)}’s referrals. Nothing has been
          transmitted.
        </p>
      )}
      <div className="dashboard-next">
        <b>What’s next?</b>
        <p>
          Save the draft for follow-up, or mark this item reviewed once you have
          finished checking it.
        </p>
        <Button
          tone="green"
          onClick={() => {
            dispatch({ type: "resolve", clientId: c.id });
            notify("Marked reviewed. Today’s queues are updated.");
            onClose();
            // The reviewed queue row disappears; return keyboard focus to the page.
            requestAnimationFrame(() => {
              const heading =
                document.querySelector<HTMLElement>(".demo-heading h1");
              if (heading) {
                heading.tabIndex = -1;
                heading.focus();
              }
            });
          }}
        >
          Mark reviewed
        </Button>
        <Link href={clientPath(c.id, "plan")}>
          Review client’s next steps →
        </Link>
      </div>
    </Dialog>
  );
}
function WorkQueues({
  onReview,
  mine = false,
  plans = false,
}: {
  onReview: (id: string) => void;
  mine?: boolean;
  plans?: boolean;
}) {
  const { state, go } = useDemo();
  const groups = [
    {
      title: "Running",
      icon: "◷",
      tone: "running",
      clients: state.clients.filter((c) => c.run?.status === "working"),
      detail: "Prepared work awaiting your review",
    },
    {
      title: "Waiting on service",
      icon: "↗",
      tone: "waiting",
      clients: state.clients.filter((c) => c.waiting),
      detail: "Follow up and keep things moving",
    },
    {
      title: "Overdue",
      icon: "!",
      tone: "overdue",
      clients: state.clients.filter((c) => c.overdue),
      detail: "Start with these time-sensitive items",
    },
  ];
  const completed = state.clients.reduce(
    (n, c) => n + c.actions.filter((a) => a.done).length,
    0,
  );
  return (
    <section className="dashboard-overview" aria-label="Your work at a glance">
      <div className="dashboard-queue-grid">
        {groups.map((g) => (
          <section
            className={`a2s-sheet dashboard-queue ${g.tone}`}
            key={g.title}
          >
            <header>
              <span className="dashboard-queue-icon" aria-hidden="true">
                {g.icon}
              </span>
              <h2>{g.title}</h2>
              <strong>{g.clients.length}</strong>
            </header>
            <p>{g.detail}</p>
            {g.clients.length ? (
              g.clients.map((c) => (
                <button
                  key={c.id}
                  className="dashboard-queue-person"
                  onClick={() =>
                    g.tone === "running"
                      ? go(clientPath(c.id, "working"))
                      : onReview(c.id)
                  }
                >
                  <span className="dashboard-avatar">{initials(c.name)}</span>
                  <span>
                    <b>{c.name}</b>
                    <small>
                      {g.tone === "running" ? "Ready for review" : c.next}
                    </small>
                  </span>
                  <span aria-hidden="true">↗</span>
                </button>
              ))
            ) : (
              <p className="demo-empty">You’re up to date here.</p>
            )}
          </section>
        ))}
      </div>
      <div className="dashboard-impact">
        <span aria-hidden="true">✓</span>
        <p>
          <b>
            {completed} plan {completed === 1 ? "action" : "actions"} completed
          </b>
          <small>In this demo workspace · from saved client plans</small>
        </p>
        <Link href="/plans">View plans →</Link>
      </div>
      {mine && (
        <section className="a2s-sheet dashboard-mine">
          <header>
            <h2>
              Mine <small>· {state.clients.length}</small>
            </h2>
            <a href="#client-table">Full client list ↓</a>
          </header>
          <div>
            {state.clients.map((c) => (
              <Link key={c.id} href={clientPath(c.id, plans ? "plan" : "")}>
                <span className="dashboard-avatar">{initials(c.name)}</span>
                <span>
                  <b>{c.name}</b>
                  <small>{c.focus}</small>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
export function Clients({
  plans = false,
  create = false,
}: {
  plans?: boolean;
  create?: boolean;
}) {
  const { state, modal, go } = useDemo(),
    params = useSearchParams(),
    filter = params.get("filter") || "Mine",
    rows = filterClients(state, filter),
    [reviewId, setReviewId] = useState<string | null>(null);
  useEffect(() => {
    if (create) modal({ type: "new" });
  }, [create]); // Route-based entry, opens once on mount.
  return (
    <>
      <Heading
        title={plans ? "Client plans" : "My clients"}
        sub={`${state.clients.length} open · ${state.clients.filter((c) => c.overdue).length} overdue · ${state.clients.filter((c) => c.waiting).length} waiting on a service`}
      >
        <Button onClick={() => modal({ type: "new" })}>Add a new person</Button>
      </Heading>
      <WorkQueues onReview={setReviewId} mine plans={plans} />
      <h2 id="client-table" className="dashboard-table-heading">
        {plans ? "All client plans" : "Client list"}
      </h2>
      <div className="demo-filters" aria-label="Client filters">
        {MY_CLIENTS.filters.map((x) => (
          <Button
            key={x}
            aria-pressed={filter === x}
            onClick={() =>
              go(
                `${plans ? "/plans" : "/clients"}?filter=${encodeURIComponent(x)}`,
              )
            }
          >
            {x}
          </Button>
        ))}
      </div>
      <Sheet>
        <div className="demo-table-scroll">
          <table className="a2s-table">
            <thead>
              <tr>
                {MY_CLIENTS.columns.map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link
                      className="demo-name"
                      href={clientPath(c.id, plans ? "plan" : "")}
                    >
                      {c.name}
                    </Link>
                    <small>{c.ref}</small>
                  </td>
                  <td>{c.focus}</td>
                  <td>{c.stage}</td>
                  <td>{c.last}</td>
                  <td className={c.overdue ? "orange" : ""}>{c.next}</td>
                  <td>{c.attention ? "Needs review" : "—"}</td>
                  <td>
                    {c.run ? (
                      <Link href={clientPath(c.id, c.run.status)}>
                        {c.run.status === "working"
                          ? "Running · open"
                          : "Done · open"}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <p className="demo-empty">No clients in this view.</p>
          )}
        </div>
      </Sheet>
      {reviewId && state.clients.find((c) => c.id === reviewId) && (
        <AttentionReview
          key={reviewId}
          c={state.clients.find((c) => c.id === reviewId)!}
          onClose={() => setReviewId(null)}
        />
      )}
    </>
  );
}
export function Profile({ c }: { c: Client }) {
  const { modal, go } = useDemo(),
    [expanded, setExpanded] = useState(false),
    done = c.actions.filter((a) => a.done).length;
  return (
    <>
      <section className="a2s-sheet demo-profile">
        <span className="a2s-avatar">{initials(c.name)}</span>
        <div className="demo-profile-id">
          <h1>{c.name}</h1>
          <p>
            {c.ref} · with Hannah Lee since 12 Aug · last contact {c.last}
          </p>
          <div className="a2s-chips">
            {c.chips.map((x) => (
              <span className="a2s-chip" key={x}>
                {x}
              </span>
            ))}
          </div>
          <small>Quick exit opens her escape plan in one click.</small>
        </div>
        <div className="demo-profile-actions">
          <div>
            <Button
              tone="orange-button"
              onClick={() => go(clientPath(c.id, "quick-exit"))}
            >
              Quick exit plan
            </Button>
            <Button tone="dark" onClick={() => go(`${clientPath(c.id)}?ask=1`)}>
              Ask about {firstName(c)}
            </Button>
            <Button
              tone="green"
              onClick={() => modal({ type: "note", clientId: c.id })}
            >
              New case note
            </Button>
          </div>
          <div>
            <TextButton
              onClick={() => modal({ type: "edit-client", clientId: c.id })}
            >
              Edit information
            </TextButton>
            <TextButton
              onClick={() => modal({ type: "letter", clientId: c.id })}
            >
              Support letter
            </TextButton>
          </div>
        </div>
      </section>
      <ProfileAsk c={c} />
      <div className="demo-profile-grid">
        <div>
          <Sheet title="Summary profile">
            <p className={expanded ? "" : "demo-summary"}>{c.summary}</p>
            <div className="demo-actions">
              <small>Checked with {firstName(c)} · 2 Sep</small>
              <TextButton
                onClick={() => modal({ type: "letter", clientId: c.id })}
              >
                Send with a referral
              </TextButton>
              <TextButton onClick={() => setExpanded(!expanded)}>
                {expanded ? "Collapse" : "Expand"}
              </TextButton>
            </div>
            <small>Updates only when you ask</small>
          </Sheet>
          <Sheet
            title="Recent contact"
            action={
              <Link href={clientPath(c.id, "notes")}>All contact notes</Link>
            }
          >
            {c.files
              .filter((f) => f.kind === "note")
              .slice(0, 3)
              .map((f) => (
                <Rail
                  key={f.id}
                  title={f.date}
                  detail={`${f.title} · Hannah`}
                  onClick={() =>
                    modal({ type: "file", clientId: c.id, file: f })
                  }
                />
              ))}
            {c.events.slice(0, 2).map((x, i) => (
              <p className="demo-history" key={i}>
                <Asset name="did" size={12} />
                {x}
              </p>
            ))}
          </Sheet>
          <Sheet title="Referrals in flight">
            <Rail
              title={
                c.best
                  ? `${c.best} · confirmed best fit`
                  : "Harbour House callback"
              }
              detail={
                c.callback ? `Callback simulated · ${c.callback}` : c.stage
              }
              onClick={() => go(clientPath(c.id, "referrals"))}
            />
            <Rail
              title="Link2Home"
              detail="Follow-up due · email chain saved in demo"
              onClick={() => go(clientPath(c.id, "referrals"))}
            />
            <Rail
              title="Shelter shortlist"
              detail={
                c.run?.status === "done"
                  ? "Ready to review"
                  : "Awaiting your decision"
              }
              meta="Open"
              onClick={() =>
                go(
                  clientPath(
                    c.id,
                    c.run?.status === "done" ? "done" : "working",
                  ),
                )
              }
            />
          </Sheet>
        </div>
        <aside>
          <Sheet title={`Needs attention · for ${firstName(c)}`}>
            <ul className="demo-rows">
              <QueueRow
                title={c.stage}
                detail={c.overdue ? "overdue since 09:00" : c.next}
                href={clientPath(c.id, "referrals")}
              />
              <QueueRow
                title="Review next steps"
                detail="Agreed actions and preferences"
                href={clientPath(c.id, "plan")}
              />
            </ul>
          </Sheet>
          <Sheet title="Files" action={<small>by type · newest first</small>}>
            {[
              ["Contact notes", "notes"],
              ["Preferences", "plan"],
              ["Support letters", "letters"],
              ["Emails", "referrals"],
              ["Calls", "referrals"],
            ].map(([title, section]) => (
              <Rail
                key={title}
                title={title}
                detail={
                  section === "notes"
                    ? `${c.files.filter((f) => f.kind === "note").length} saved · latest ${c.last}`
                    : "Open client record"
                }
                meta="Open"
                onClick={() => go(clientPath(c.id, section))}
              />
            ))}
          </Sheet>
          <Sheet
            title={`Plan · ${done} of ${c.actions.length}`}
            action={<Link href={clientPath(c.id, "plan")}>Open plan</Link>}
          >
            <progress value={done} max={c.actions.length || 1} />
            <p className="demo-label">Next</p>
            <ul className="demo-rows">
              {c.actions
                .filter((a) => !a.done)
                .slice(0, 2)
                .map((a) => (
                  <QueueRow
                    key={a.id}
                    title={a.title}
                    detail={a.detail}
                    href={clientPath(c.id, "plan")}
                  />
                ))}
            </ul>
          </Sheet>
        </aside>
      </div>
    </>
  );
}
function ProfileAsk({ c }: { c: Client }) {
  const params = useSearchParams();
  return params.get("ask") ? <Composer client={c} expanded /> : null;
}
export function Plan({ c }: { c: Client }) {
  const { dispatch, modal, notify, go } = useDemo(),
    [suggestion, setSuggestion] = useState(""),
    [action, setAction] = useState("");
  const addAction = (title: string, id?: string) => {
    if (!title.trim()) return;
    dispatch({
      type: "action",
      clientId: c.id,
      item: {
        id: id || crypto.randomUUID(),
        title: title.trim(),
        detail: "Agreed with client · Hannah",
        group: "Client-led additions",
      },
    });
    setAction("");
    notify("Added to the plan.");
  };
  return (
    <>
      <Heading
        title={`${firstName(c)}’s plan`}
        sub={`Client-led · reviewed together · ${c.actions.filter((x) => x.done).length} of ${c.actions.length} done`}
      />
      <div className="demo-plan-grid">
        <aside>
          <Sheet title="Suggestions">
            {Array.from(
              new Set([...PLAN.suggestions.chips, ...c.suggestions]),
            ).map((name) => (
              <button
                key={name}
                role="switch"
                aria-checked={c.suggestions.includes(name)}
                className="demo-toggle"
                onClick={() =>
                  dispatch({ type: "suggestion", clientId: c.id, name })
                }
              >
                <span>{name}</span>
                <Asset
                  name={
                    c.suggestions.includes(name) ? "toggle-on" : "toggle-off"
                  }
                  width={36}
                  size={20}
                />
              </button>
            ))}
            <form
              className="demo-inline"
              onSubmit={(e) => {
                e.preventDefault();
                if (
                  suggestion.trim() &&
                  !c.suggestions.includes(suggestion.trim())
                )
                  dispatch({
                    type: "suggestion",
                    clientId: c.id,
                    name: suggestion.trim(),
                  });
                setSuggestion("");
              }}
            >
              <input
                aria-label="Custom suggestion"
                value={suggestion}
                placeholder="e.g. Children at school in Ashfield"
                onChange={(e) => setSuggestion(e.target.value)}
              />
              <Button type="submit" tone="dark" disabled={!suggestion.trim()}>
                Add
              </Button>
            </form>
            <small>Suggestions, not the plan. {firstName(c)} decides.</small>
          </Sheet>
          <Sheet
            title={`Reviewed with ${firstName(c)}`}
            action={
              <TextButton
                onClick={() => modal({ type: "review", clientId: c.id })}
              >
                Add a review
              </TextButton>
            }
          >
            {c.reviews.map((x, i) => (
              <p className="demo-review" key={i}>
                {x}
              </p>
            ))}
          </Sheet>
          {!c.dismissedSafety && !c.actions.some((a) => a.id === "safety") && (
            <Sheet title="Safety plan" note="Suggested · not in the plan yet">
              <div className="demo-actions">
                <Button
                  onClick={() =>
                    addAction("Review safety plan together", "safety")
                  }
                >
                  Add to plan
                </Button>
                <TextButton
                  onClick={() =>
                    dispatch({ type: "dismiss-safety", clientId: c.id })
                  }
                >
                  Not now
                </TextButton>
              </div>
            </Sheet>
          )}
        </aside>
        <Sheet title="Actions">
          <div className="demo-actions spread">
            <small>Quick exit</small>
            <TextButton onClick={() => go(clientPath(c.id, "quick-exit"))}>
              Open the full plan
            </TextButton>
          </div>
          {c.quick.slice(0, 3).map((x) => (
            <label className="demo-plan-row" key={x.id}>
              <input
                type="checkbox"
                checked={!!x.done}
                onChange={() =>
                  dispatch({ type: "toggle-quick", clientId: c.id, id: x.id })
                }
              />
              <b>{x.title}</b>
              <small>{x.detail}</small>
            </label>
          ))}
          {Array.from(new Set(c.actions.map((a) => a.group || "Actions"))).map(
            (group) => (
              <div key={group}>
                <p className="demo-label">{group}</p>
                {c.actions
                  .filter((a) => (a.group || "Actions") === group)
                  .map((a) => (
                    <label className="demo-plan-row" key={a.id}>
                      <input
                        type="checkbox"
                        checked={!!a.done}
                        onChange={() =>
                          dispatch({
                            type: "toggle-action",
                            clientId: c.id,
                            id: a.id,
                          })
                        }
                      />
                      <b>{a.title}</b>
                      <small>{a.detail}</small>
                    </label>
                  ))}
              </div>
            ),
          )}
          {c.id === "maya" && (
            <>
              <p className="demo-label">Declined</p>
              <div className="demo-plan-row">
                <span className="demo-dot muted" />
                <div>
                  <b>Shelter with a 10 pm curfew · declined 2 Sep</b>
                  <small>
                    Wants to keep night shifts · revisit if no bed by Friday
                  </small>
                  <TextButton
                    onClick={() =>
                      addAction(
                        "Revisit curfew options with Maya",
                        "revisit-curfew",
                      )
                    }
                  >
                    Revisit
                  </TextButton>
                </div>
              </div>
            </>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addAction(action);
            }}
          >
            <label className="demo-label" htmlFor="plan-add">
              Add anything · not from a suggestion
            </label>
            <div className="demo-inline">
              <textarea
                id="plan-add"
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder={`Talk it through · e.g. ${firstName(c)} wants to keep night shifts`}
              />
              <Button type="submit" tone="dark" disabled={!action.trim()}>
                Add to plan
              </Button>
            </div>
          </form>
          <small>
            Stored with the plan · picks up where you left off next time
          </small>
          <div className="demo-actions">
            <Button
              tone="dark"
              onClick={() => modal({ type: "letter", clientId: c.id })}
            >
              Support letter from this plan
            </Button>
            <small>Uses case notes and this plan</small>
          </div>
        </Sheet>
      </div>
    </>
  );
}
export function Files({ c, kind }: { c?: Client; kind: "letters" | "notes" }) {
  const { state, modal } = useDemo(),
    clients = c ? [c] : state.clients,
    files = clients.flatMap((client) =>
      client.files
        .filter((f) =>
          kind === "letters" ? f.kind === "letter" : f.kind !== "letter",
        )
        .map((file) => ({ client, file })),
    );
  return (
    <>
      <Heading
        title={
          kind === "letters"
            ? "Letters"
            : `Notes · ${c ? firstName(c) : "all clients"}`
        }
        sub={`${files.length} saved · synthetic preview`}
      >
        {c && (
          <Button
            tone={kind === "notes" ? "green" : "dark"}
            onClick={() =>
              modal({
                type: kind === "notes" ? "note" : "letter",
                clientId: c.id,
              })
            }
          >
            {kind === "notes" ? "New case note" : "Draft support letter"}
          </Button>
        )}
      </Heading>
      <Sheet>
        {files.map(({ client, file }) => (
          <Rail
            key={file.id}
            title={file.title}
            detail={`${client.name} · ${file.date}`}
            meta="Open"
            onClick={() => modal({ type: "file", clientId: client.id, file })}
          />
        ))}
        {!files.length && (
          <p>No {kind} yet. Create one from the client’s profile.</p>
        )}
      </Sheet>
    </>
  );
}
export function Referrals({ c }: { c?: Client }) {
  const { state, dispatch, modal, go, notify } = useDemo(),
    clients = c ? [c] : state.clients.filter((x) => x.waiting || x.overdue),
    [reviewId, setReviewId] = useState<string | null>(null);
  return (
    <>
      <Heading
        title={c ? `Referrals · ${firstName(c)}` : "Follow-ups"}
        sub="Review, draft and record the next agreed step"
      />
      <div className="demo-two">
        {clients.map((client) => (
          <Sheet
            key={client.id}
            title={client.name}
            action={<Link href={clientPath(client.id)}>Profile</Link>}
          >
            <p>{client.stage}</p>
            <p className={client.overdue ? "orange" : "demo-muted"}>
              {client.next}
            </p>
            {client.callback && <p>Callback simulated: {client.callback}</p>}
            <div className="demo-actions">
              <Button tone="dark" onClick={() => setReviewId(client.id)}>
                Draft follow-up
              </Button>
              <Button
                onClick={() => {
                  dispatch({ type: "resolve", clientId: client.id });
                  notify("Follow-up reviewed. Today and filters are updated.");
                }}
              >
                Mark reviewed
              </Button>
              <TextButton onClick={() => go(clientPath(client.id, "shelters"))}>
                Find shelters
              </TextButton>
            </div>
            {client.files.some((file) => file.kind === "message") && (
              <p className="demo-label">Saved drafts and messages</p>
            )}
            {client.files
              .filter((file) => file.kind === "message")
              .map((file) => (
                <Rail
                  key={file.id}
                  title={file.title}
                  detail={file.date}
                  meta="Open"
                  onClick={() =>
                    modal({ type: "file", clientId: client.id, file })
                  }
                />
              ))}
            <p className="demo-label">History</p>
            {client.events.map((x, i) => (
              <p className="demo-history" key={i}>
                <Asset name="did" size={12} />
                {x}
              </p>
            ))}
          </Sheet>
        ))}
      </div>
      {!clients.length && (
        <Sheet>
          <p>No follow-ups waiting. You’re up to date.</p>
        </Sheet>
      )}
      {reviewId && state.clients.find((client) => client.id === reviewId) && (
        <AttentionReview
          key={reviewId}
          c={state.clients.find((client) => client.id === reviewId)!}
          onClose={() => setReviewId(null)}
        />
      )}
    </>
  );
}
export function States() {
  const rows = [
    "Nav link",
    "Alerts pill",
    "Identity chip",
    "Spotlight bar",
    "Search island",
    "Filter chip",
    "Checklist row",
    "Plan row",
    "Needs-you draft",
    "Toggle",
    "Table row",
    "Result card",
    "Popover row",
    "Black pill",
    "Ghost pill",
    "Composer",
    "Add suggestion",
    "Find housing",
    "Search button",
    "Spotlight result row",
  ];
  const { notify } = useDemo();
  return (
    <>
      <Heading
        title="A2 states"
        sub="Shared controls · rest, hover, pressed, focus and disabled"
      />
      <Sheet>
        <div className="demo-table-scroll">
          <table className="a2s-table">
            <thead>
              <tr>
                <th>Control</th>
                {["Rest", "Hover", "Pressed", "Focus", "Disabled"].map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row}>
                  <td>{row}</td>
                  {["rest", "hover", "pressed", "focus", "disabled"].map(
                    (s) => (
                      <td key={s}>
                        <StateControl row={row} state={s} />
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Sheet>
    </>
  );
}

function StateControl({ row, state }: { row: string; state: string }) {
  const [checked, setChecked] = useState(false),
    [value, setValue] = useState("");
  const { notify } = useDemo(),
    disabled = state === "disabled",
    className = `state-${state}`;
  if (row === "Toggle")
    return (
      <button
        className={`demo-state-switch ${className}`}
        role="switch"
        aria-label={`Suggestion ${state}`}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => setChecked(!checked)}
      >
        <Asset
          name={checked ? "toggle-on" : "toggle-off"}
          width={36}
          size={20}
        />
      </button>
    );
  if (["Checklist row", "Plan row"].includes(row))
    return (
      <label className={`demo-plan-row ${className}`}>
        <input
          type="checkbox"
          disabled={disabled}
          checked={checked}
          onChange={() => setChecked(!checked)}
        />
        <span>{row === "Plan row" ? "Safe phone" : "Confirm callback"}</span>
      </label>
    );
  if (["Composer", "Needs-you draft"].includes(row))
    return (
      <textarea
        className={className}
        rows={2}
        disabled={disabled}
        aria-label={`${row} ${state}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={
          row === "Composer"
            ? "Say what needs doing"
            : "Hi Maya, please confirm…"
        }
      />
    );
  if (["Spotlight bar", "Add suggestion"].includes(row))
    return (
      <input
        className={className}
        disabled={disabled}
        aria-label={`${row} ${state}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={
          row === "Spotlight bar" ? "Search a client" : "Add a suggestion"
        }
      />
    );
  const label =
    row === "Nav link"
      ? "Today"
      : row === "Filter chip"
        ? "Overdue"
        : row === "Black pill"
          ? "Run for Maya"
          : row === "Ghost pill"
            ? "Cancel"
            : row === "Find housing"
              ? "Finding housing"
              : row === "Table row"
                ? "Maya Thompson"
                : row === "Result card"
                  ? "Harbour House"
                  : row === "Popover row"
                    ? "Open profile"
                    : row === "Spotlight result row"
                      ? "Maya · LP-0248"
                      : row;
  return (
    <Button
      className={className}
      tone={row === "Black pill" ? "dark" : ""}
      disabled={disabled}
      aria-pressed={row === "Filter chip" ? checked : undefined}
      onClick={() => {
        setChecked(!checked);
        notify(`${row} activated`);
      }}
    >
      {row === "Identity chip" ? (
        <>
          <span className="a2s-avatar">HL</span> Hannah
        </>
      ) : row === "Search island" || row === "Search button" ? (
        <Asset name="search" />
      ) : row === "Alerts pill" ? (
        <>
          Alerts <span className="a2s-badge">3</span>
        </>
      ) : row === "Find housing" ? (
        <>
          <Asset name="spinner" size={16} /> {label}
        </>
      ) : (
        label
      )}
    </Button>
  );
}
