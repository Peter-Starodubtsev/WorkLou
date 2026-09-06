"use client";
import { useState } from "react";
import Link from "next/link";
import { Sheet } from "../a2/Sheet";
import { WORKING } from "../../lib/a2-mock";
import { clientPath, firstName, eligibility } from "../../lib/demo/store";
import type { Client, Shelter } from "../../lib/demo/store";
import { useDemo } from "./context";
import { Asset, Button, TextButton, Heading, Rail } from "./ui";
export function Shelters({ c }: { c?: Client }) {
  const { state, modal, dispatch, notify, go } = useDemo(),
    [query, setQuery] = useState(
      c
        ? `${firstName(c)}: dog, Inner West, no children, Centrelink, needs a bed tonight, no curfew`
        : "",
    ),
    [ask, setAsk] = useState<string | null>(null),
    [filters, setFilters] = useState<string[]>([]),
    [service, setService] = useState("");
  const toggle = (x: string) =>
    setFilters(
      filters.includes(x) ? filters.filter((f) => f !== x) : [...filters, x],
    );
  const rows = state.shelters.filter((s) =>
    filters.every((f) =>
      f === "Pets"
        ? s.pets
        : f === "No curfew"
          ? s.noCurfew
          : f === "Nil income accepted"
            ? s.nilIncome
            : f === "Women + children"
              ? s.children
              : f === "Women only"
                ? !s.children
                : f === "Inner West"
                  ? !["Manly", "Statewide"].includes(s.area)
                  : true,
    ),
  );
  const matches =
    ask === null
      ? []
      : rows.filter((s) => eligibility(s, ask).startsWith("Eligible"));
  function choose(s: Shelter) {
    if (!c) {
      notify("Open a client’s Shelters tab to choose for that client.");
      return;
    }
    dispatch({ type: "choose", clientId: c.id, shelterId: s.id });
    notify(
      `${s.name} selected for ${firstName(c)}. Capacity still needs confirmation.`,
    );
  }
  return (
    <>
      <Heading
        title="Shelters and crisis beds"
        sub={`${state.shelters.length} services · mock capacity with check times${c ? ` · for ${firstName(c)}` : ""}`}
      />
      <form
        className="demo-shelter-ask a2s-matte"
        onSubmit={(e) => {
          e.preventDefault();
          setAsk(query);
        }}
      >
        <Asset name="search" />
        <input
          aria-label="Shelter requirements"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe needs · pets, area, no curfew, children"
        />
        <Button tone="dark" type="submit">
          Find shelters
        </Button>
      </form>
      <div className="demo-filters">
        {[
          "Inner West",
          "Women only",
          "Women + children",
          "Pets",
          "Nil income accepted",
          "No curfew",
        ].map((x) => (
          <Button
            key={x}
            aria-pressed={filters.includes(x)}
            onClick={() => toggle(x)}
          >
            {x}
          </Button>
        ))}
        {(filters.length > 0 || ask !== null) && (
          <TextButton
            onClick={() => {
              setFilters([]);
              setAsk(null);
              setQuery("");
            }}
          >
            Clear filters
          </TextButton>
        )}
      </div>
      {ask !== null ? (
        <>
          <h2 className="demo-small-heading">
            {matches.length} eligible{c ? ` for ${firstName(c)}` : ""}{" "}
            <small>From your request · simulated service data</small>
          </h2>
          <div className="demo-three">
            {matches.map((s) => (
              <Sheet
                key={s.id}
                title={s.name}
                action={
                  <span className="demo-green">{eligibility(s, ask)}</span>
                }
              >
                <small>{s.area} · Inner West</small>
                <dl className="demo-facts">
                  <dt>Takes</dt>
                  <dd>{s.takes}</dd>
                  <dt>Beds</dt>
                  <dd>
                    {s.beds ?? "Unknown"} · {s.checked}
                  </dd>
                  <dt>Why</dt>
                  <dd>
                    {s.pets ? "Pets accepted · " : ""}
                    {s.noCurfew ? "no curfew" : "curfew needs review"}
                  </dd>
                </dl>
                <div className="demo-actions">
                  <Button
                    tone={c?.best === s.id ? "dark" : ""}
                    onClick={() => choose(s)}
                  >
                    {c?.best === s.id ? "Selected" : "Choose"}
                  </Button>
                  <TextButton
                    onClick={() =>
                      modal({ type: "shelter", shelter: s, clientId: c?.id })
                    }
                  >
                    Details
                  </TextButton>
                </div>
              </Sheet>
            ))}
          </div>
          <details className="a2s-sheet demo-spaced">
            <summary>
              {rows.length - matches.length} not eligible · see why
            </summary>
            {rows
              .filter((s) => !matches.includes(s))
              .map((s) => (
                <p key={s.id}>
                  {s.name} — {eligibility(s, ask)}
                </p>
              ))}
          </details>
        </>
      ) : (
        <Sheet>
          <div className="demo-table-scroll">
            <table className="a2s-table">
              <thead>
                <tr>
                  {[
                    "Shelter",
                    "Area",
                    "Takes",
                    "Beds (how, when)",
                    c ? `For ${firstName(c)}` : "Details",
                  ].map((x) => (
                    <th key={x}>{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <TextButton
                        onClick={() =>
                          modal({
                            type: "shelter",
                            shelter: s,
                            clientId: c?.id,
                          })
                        }
                      >
                        {s.name}
                      </TextButton>
                    </td>
                    <td>{s.area}</td>
                    <td>{s.takes}</td>
                    <td>
                      <b className={s.beds === null ? "orange" : ""}>
                        {s.beds === null
                          ? "unknown"
                          : `${s.beds} bed${s.beds === 1 ? "" : "s"}`}
                      </b>
                      <small>{s.checked}</small>
                    </td>
                    <td>
                      {c ? (
                        eligibility(s, query)
                      ) : (
                        <TextButton
                          onClick={() => modal({ type: "shelter", shelter: s })}
                        >
                          Open
                        </TextButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <p className="demo-empty">No services match those filters.</p>
            )}
          </div>
        </Sheet>
      )}
      <div className="demo-three demo-spaced">
        <Sheet
          title="Heard of a new service?"
          note="Adds a mock review request; does not contact a provider."
        >
          <form
            className="demo-inline"
            onSubmit={(e) => {
              e.preventDefault();
              if (service.trim()) {
                dispatch({ type: "discover", name: service.trim() });
                setService("");
                notify("Added to the service review queue.");
              }
            }}
          >
            <input
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="Type its name"
              aria-label="New service name"
            />
            <Button type="submit" disabled={!service.trim()}>
              Add
            </Button>
          </form>
          {state.discoveries.map((x, i) => (
            <p key={i}>{x} · awaiting review</p>
          ))}
        </Sheet>
        <Sheet title="Last checked">
          {state.shelters.slice(0, 4).map((s) => (
            <Rail
              key={s.id}
              title={s.name}
              detail={s.checked}
              onClick={() => modal({ type: "shelter", shelter: s })}
            />
          ))}
        </Sheet>
        <Sheet title="Call list · today">
          {state.shelters
            .filter((s) => s.beds === null)
            .map((s) => (
              <Rail
                key={s.id}
                title={s.name}
                detail="Confirm capacity · demo task"
                onClick={() =>
                  modal({ type: "shelter", shelter: s, clientId: c?.id })
                }
              />
            ))}
          {c && (
            <Button
              tone="dark"
              onClick={() => {
                dispatch({
                  type: "run",
                  clientId: c.id,
                  ask: query || `Find housing for ${firstName(c)}`,
                });
                go(clientPath(c.id, "working"));
              }}
            >
              Review shortlist with {firstName(c)}
            </Button>
          )}
        </Sheet>
      </div>
    </>
  );
}
export function Working({ c }: { c: Client }) {
  const { dispatch, go, modal } = useDemo(),
    [activity, setActivity] = useState(true),
    [draft, setDraft] = useState(
      c.run?.draft ||
        `Hi ${firstName(c)}, please confirm your housing preferences before we contact any service.`,
    );
  const finish = (decision: "sent" | "skipped") => {
    dispatch({
      type: "finish",
      clientId: c.id,
      decision,
      draft,
      id: crypto.randomUUID(),
      date: new Date().toLocaleString("en-AU"),
    });
    go(clientPath(c.id, "done"));
  };
  if (c.run?.status === "done")
    return (
      <>
        <Heading
          title="This shortlist is ready"
          sub="Your decision and paper trail have been saved."
        />
        <Button tone="dark" onClick={() => go(clientPath(c.id, "done"))}>
          Open results
        </Button>
      </>
    );
  return (
    <>
      <div className="demo-task a2s-matte">
        <b>
          {c.run?.ask ||
            `Find housing for ${firstName(c)}, close to transport.`}
        </b>
        <span>
          <Asset name="spinner" size={16} />
          Awaiting you
        </span>
      </div>
      <div className="demo-actions spread">
        <small>Mock task · sends and bookings wait for your OK</small>
        <TextButton onClick={() => setActivity(!activity)}>
          {activity ? "Hide activity" : "Show activity"}
        </TextButton>
      </div>
      <div className={activity ? "demo-working-grid" : ""}>
        <Sheet>
          <div className="demo-step">
            <Asset name="did" size={16} />
            <div>
              <b>Read {firstName(c)}’s note and preferences</b>
              <small>{c.focus} · Inner West · needs bus or train</small>
            </div>
            <small>09:26</small>
          </div>
          <div className="demo-step">
            <Asset name="did" size={16} />
            <div>
              <b>Searched the housing directory</b>
              <small>8 mock services · matching the request</small>
            </div>
            <small>09:26</small>
          </div>
          <div className="demo-step">
            <Asset name="spinner" size={16} />
            <div>
              <b>Checking pet policy and vacancy</b>
              <small>Service constraints shown for review</small>
              <p>Harbour House · dogs OK · curfew 11 pm</p>
              <p>Bridgewell · pets on file · no curfew · no bed</p>
              <p>Bonnie Support · no curfew · nil income accepted</p>
            </div>
            <small className="orange">now</small>
          </div>
          <div className="demo-approval">
            <p>
              <span className="a2s-badge">Needs you</span> Send {firstName(c)}{" "}
              the shortlist and confirm preferences?
            </p>
            <textarea
              aria-label="Message draft"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
            />
            <small>
              Edit before approving · simulated message saved to this client’s
              files
            </small>
            <div className="demo-actions">
              <Button
                tone="dark"
                disabled={!draft.trim()}
                onClick={() => finish("sent")}
              >
                Send · simulate
              </Button>
              <TextButton onClick={() => finish("skipped")}>Skip</TextButton>
            </div>
          </div>
          <div className="demo-step">
            <Asset name="ring" size={16} />
            <div>
              <b>Write the shortlist into {firstName(c)}’s record</b>
              <small>After you decide</small>
            </div>
            <small>queued</small>
          </div>
          <small>Nothing is sent to a phone or service in this preview.</small>
        </Sheet>
        {activity && (
          <aside>
            <Sheet
              title="Activity"
              action={<small className="orange">Mock run</small>}
            >
              <div className="demo-mono">
                {[
                  "09:26  Opened client contact note",
                  "09:26  Read agreed preferences",
                  "09:26  Searched mock directory: 8",
                  "09:27  Checked pet and curfew policies",
                  "09:27  Kept capacity check times",
                  "09:28  Drafted message for review",
                  "09:28  Waiting for your decision",
                ].map((x) => (
                  <p key={x}>{x}</p>
                ))}
              </div>
              <h3 className="demo-small-heading">Sources</h3>
              <Rail
                title="Contact note"
                detail={c.last}
                onClick={() =>
                  modal({ type: "file", clientId: c.id, file: c.files[0] })
                }
              />
              <Rail
                title="Preferences"
                detail="Reviewed with client"
                onClick={() => go(clientPath(c.id, "plan"))}
              />
              <Rail
                title="Housing directory"
                detail="Synthetic demo directory"
                onClick={() => go(clientPath(c.id, "shelters"))}
              />
            </Sheet>
          </aside>
        )}
      </div>
      {!activity && (
        <p className="demo-sources">
          Sources · <Link href={clientPath(c.id, "notes")}>Contact note</Link> ·{" "}
          <Link href={clientPath(c.id, "plan")}>Preferences</Link> ·{" "}
          <Link href={clientPath(c.id, "shelters")}>Housing directory</Link>
        </p>
      )}
    </>
  );
}
export function Done({ c }: { c: Client }) {
  const { state, dispatch, modal, notify, go } = useDemo(),
    [candidate, setCandidate] = useState<string | null>(null);
  const options = state.shelters.filter((s) =>
    ["harbour", "bridgewell", "cedar"].includes(s.id),
  );
  if (c.run?.status !== "done")
    return (
      <>
        <Heading
          title="Review the task first"
          sub="Results become final after you send or skip the draft."
        />
        <Button tone="dark" onClick={() => go(clientPath(c.id, "working"))}>
          Open Working
        </Button>
      </>
    );
  return (
    <>
      <div className="demo-task a2s-matte">
        <Asset name="did" size={16} />
        <b>{c.run.ask}</b>
        <small>Done · decision saved</small>
      </div>
      <div className="demo-done-grid">
        {options.map((s, i) => (
          <section
            className={`a2s-sheet demo-option ${c.best === s.id ? "best" : ""} ${candidate === s.id ? "candidate" : ""}`}
            key={s.id}
          >
            <div className="demo-option-top">
              <strong>{s.walk} min</strong>
              {c.best === s.id && <span className="a2s-badge">Locked in</span>}
            </div>
            <small>walk to the station</small>
            <h2>{s.name}</h2>
            <small>{s.area}</small>
            <p>{s.takes}</p>
            <p>
              {s.beds === null
                ? "Vacancy: confirm by phone"
                : `${s.beds} mock bed${s.beds === 1 ? "" : "s"} · ${s.checked}`}
            </p>
            {s.id === "harbour" && (
              <small className="orange">
                11 pm curfew · confirm whether suitable
              </small>
            )}
            <TextButton
              onClick={() =>
                modal({ type: "shelter", shelter: s, clientId: c.id })
              }
            >
              Shelter details
            </TextButton>
            <div className="demo-option-actions">
              {candidate === s.id ? (
                <>
                  <Button
                    tone="dark"
                    onClick={() => {
                      dispatch({
                        type: "choose",
                        clientId: c.id,
                        shelterId: s.id,
                      });
                      setCandidate(null);
                      notify(`${s.name} confirmed. No booking has been made.`);
                    }}
                  >
                    Confirm {s.name}
                  </Button>
                  <TextButton onClick={() => setCandidate(null)}>
                    Cancel
                  </TextButton>
                </>
              ) : (
                <Button
                  tone={i === 0 && !c.best ? "dark" : ""}
                  disabled={c.best === s.id}
                  onClick={() => setCandidate(s.id)}
                >
                  {c.best === s.id ? "Current best fit" : `Choose ${s.name}`}
                </Button>
              )}
            </div>
          </section>
        ))}
        <Sheet title="Paper trail">
          {c.events.map((x, i) => (
            <p className="demo-history" key={i}>
              <Asset name="did" size={12} />
              {x}
            </p>
          ))}
          <Link href={clientPath(c.id, "notes")}>
            Open {firstName(c)}’s file
          </Link>
        </Sheet>
      </div>
      <small>Choose a shelter, then confirm. A choice is not a booking.</small>
      <div className="demo-two demo-did">
        <Sheet title="Did">
          <p>Read {firstName(c)}’s note and preferences</p>
          <p>Searched the mock directory and checked requirements</p>
          <p>
            {c.run.decision === "sent"
              ? "Saved the simulated message to the client file"
              : "Skipped the message"}
          </p>
          {c.best && <p>Saved your confirmed best fit</p>}
          {c.callback && <p>Saved a simulated callback · {c.callback}</p>}
        </Sheet>
        <Sheet title="Didn’t">
          <p>Did not contact a real service</p>
          <p>Did not send a real message</p>
          <p>Did not make a real booking</p>
        </Sheet>
      </div>
      <div className="demo-actions demo-done-actions">
        <Button
          tone="dark"
          disabled={!c.best}
          onClick={() => modal({ type: "callback", clientId: c.id })}
        >
          {c.callback ? "Edit mock callback" : "Book the callback"}
        </Button>
        <Button
          onClick={() => {
            options.forEach((s) =>
              dispatch({
                type: "action",
                clientId: c.id,
                item: {
                  id: `shelter-${s.id}`,
                  title: `Review ${s.name}`,
                  detail: `${s.area} · check suitability and capacity`,
                  group: "Housing pathway",
                },
              }),
            );
            notify("Three shelter options added to the client’s plan.");
          }}
        >
          Add all three to {firstName(c)}’s plan
        </Button>
        <Link href={clientPath(c.id, "plan")}>Open plan</Link>
        {!c.best && (
          <small>Confirm a best fit before booking a mock callback.</small>
        )}
      </div>
    </>
  );
}
