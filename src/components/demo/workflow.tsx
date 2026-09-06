"use client";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Sheet } from "../a2/Sheet";
import "./workflow-cards.css";
import { downloadCalendar } from "./calendar";
import { DraftReview } from "./interactions";
import { clientPath, firstName, eligibility } from "../../lib/demo/store";
import type { Client, Shelter } from "../../lib/demo/store";
import { useDemo } from "./context";
import { Asset, Button, TextButton, Heading, Rail } from "./ui";
function PawIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <ellipse cx="5" cy="6" rx="2" ry="3" />
      <ellipse cx="10" cy="4" rx="2" ry="3" />
      <ellipse cx="15" cy="6" rx="2" ry="3" />
      <path d="M4 14c0-3 3-5 6-5s6 2 6 5c0 4-4 2-6 2s-6 2-6-2" />
    </svg>
  );
}
function ShelterTags({ s }: { s: Shelter }) {
  return (
    <span className="workflow-tags">
      <span>
        <i aria-hidden="true">♀</i>
        {s.children ? "Women + children" : "Women"}
      </span>
      <span className={s.pets ? "positive" : "muted"}>
        <PawIcon />
        {s.pets ? "Pets welcome" : "No pets"}
      </span>
      <span>
        <i aria-hidden="true">◷</i>
        {s.noCurfew ? "No curfew" : "Curfew · check"}
      </span>
      <span>
        <i aria-hidden="true">⌖</i>
        {s.area}
      </span>
      <span className={s.beds ? "positive" : "muted"}>
        <i aria-hidden="true">▱</i>
        {s.beds === null
          ? "Capacity unknown"
          : `${s.beds} mock bed${s.beds === 1 ? "" : "s"}`}
      </span>
    </span>
  );
}
function ShelterDetails({
  s,
  onClose,
  children,
}: {
  s: Shelter;
  onClose: () => void;
  children?: ReactNode;
}) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    panel.current?.scrollIntoView({ block: "nearest" });
  }, [s.id]);
  return (
    <section
      ref={panel}
      className="a2s-sheet workflow-details"
      id="shelter-expanded"
      aria-label={`${s.name} details`}
    >
      <div className="demo-actions spread">
        <h2>{s.name}</h2>
        <TextButton onClick={onClose}>Close details</TextButton>
      </div>
      <ShelterTags s={s} />
      <div className="workflow-detail-grid">
        <div>
          <h3>Who this service supports</h3>
          <p>{s.takes}</p>
          <p>
            {s.nilIncome
              ? "Nil income accepted"
              : "Income requirements need checking"}
          </p>
        </div>
        <div>
          <h3>Capacity and location</h3>
          <p>
            {s.walk} minutes’ walk to the station · {s.area}
          </p>
          <p>{s.checked} · synthetic service information</p>
        </div>
        <div>
          <h3>Before a referral</h3>
          <p>
            Review suitability with the client and confirm vacancy, contact
            details and requirements with the service. A saved choice is not a
            booking.
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}
export function Shelters({ c }: { c?: Client }) {
  const { state, modal, dispatch, notify, go } = useDemo(),
    [query, setQuery] = useState(
      c
        ? `${firstName(c)}: dog, Inner West, no children, Centrelink, needs a bed tonight, no curfew`
        : "",
    ),
    [ask, setAsk] = useState<string | null>(null),
    [filters, setFilters] = useState<string[]>([]),
    [service, setService] = useState(""),
    [expanded, setExpanded] = useState<string | null>(null);
  const expandedShelter = state.shelters.find((s) => s.id === expanded);
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
    if (!eligibility(s, ask ?? query).startsWith("Eligible")) {
      notify(
        "This service does not match the current requirements. Review the requirements before choosing.",
      );
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
      {expandedShelter && (
        <ShelterDetails s={expandedShelter} onClose={() => setExpanded(null)}>
          {c && (
            <div className="demo-actions">
              <Button
                tone="dark"
                disabled={
                  !eligibility(expandedShelter, ask ?? query).startsWith(
                    "Eligible",
                  )
                }
                onClick={() => choose(expandedShelter)}
              >
                {c.best === expandedShelter.id
                  ? "Confirmed choice"
                  : `Confirm choice for ${firstName(c)}`}
              </Button>
              <Link href={clientPath(c.id, "plan")}>Review client plan</Link>
              <small>{eligibility(expandedShelter, ask ?? query)}</small>
            </div>
          )}
        </ShelterDetails>
      )}
      <h2 className="demo-small-heading">
        {ask === null
          ? `${rows.length} services`
          : `${matches.length} eligible${c ? ` for ${firstName(c)}` : ""}`}{" "}
        <small>Open a service to review · capacity is mock data</small>
      </h2>
      {ask === null ? (
        <Sheet>
          <div className="demo-table-scroll">
            <table className="a2s-table workflow-shelter-table">
              <thead>
                <tr>
                  <th>Shelter</th>
                  <th>Area</th>
                  <th>Supports</th>
                  <th>Beds (how, when)</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr
                    key={s.id}
                    className={expanded === s.id ? "expanded" : ""}
                    onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                  >
                    <td>
                      <TextButton
                        aria-expanded={expanded === s.id}
                        aria-controls="shelter-expanded"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpanded(expanded === s.id ? null : s.id);
                        }}
                      >
                        {s.name}
                      </TextButton>
                    </td>
                    <td>{s.area}</td>
                    <td>
                      <span className="workflow-tags">
                        <span>Women{s.children ? " + children" : ""}</span>
                        <span>
                          <PawIcon />
                          {s.pets ? "Pets welcome" : "No pets"}
                        </span>
                        <span>
                          {s.noCurfew ? "◷ No curfew" : "Curfew · check"}
                        </span>
                      </span>
                    </td>
                    <td>
                      <b>
                        {s.beds === null ? "Unknown" : `${s.beds} mock beds`}
                      </b>
                      <small>{s.checked}</small>
                    </td>
                    <td>{c ? eligibility(s, query) : "Review details ↗"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Sheet>
      ) : (
        <div className="demo-three workflow-shelter-grid">
          {(ask === null ? rows : matches).map((s) => (
            <button
              key={s.id}
              type="button"
              className={`a2s-sheet workflow-shelter-tile ${expanded === s.id ? "expanded" : ""}`}
              aria-expanded={expanded === s.id}
              aria-controls="shelter-expanded"
              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
            >
              <span className="workflow-tile-heading">
                <strong>{s.name}</strong>
                <span aria-hidden="true">{expanded === s.id ? "−" : "↗"}</span>
              </span>
              <ShelterTags s={s} />
              <span className="workflow-service-copy">{s.takes}</span>
              <span className="workflow-tile-footer">
                <span>{ask !== null ? eligibility(s, ask) : s.checked}</span>
                <span>
                  {c?.best === s.id ? "✓ Confirmed choice" : "Review details"}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
      {!(ask === null ? rows : matches).length && (
        <p className="demo-empty">
          No services match those requirements. Adjust or clear filters to
          review more services.
        </p>
      )}
      {ask !== null && (
        <details className="a2s-sheet demo-spaced">
          <summary>
            {rows.length - matches.length} not eligible · see why
          </summary>
          {rows
            .filter((s) => !matches.includes(s))
            .map((s) => (
              <p key={s.id}>
                <TextButton onClick={() => setExpanded(s.id)}>
                  {s.name}
                </TextButton>{" "}
                — {eligibility(s, ask)}
              </p>
            ))}
        </details>
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
            <DraftReview client={c} text={draft} title="Check this message" />
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
    [candidate, setCandidate] = useState<string | null>(null),
    [expanded, setExpanded] = useState<string | null>(null);
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
      <p className="workflow-next-step">
        <b>
          {c.best
            ? "Next: review the choice with your client."
            : "Ready for your review."}
        </b>{" "}
        {c.best
          ? "Arrange a callback to confirm capacity, or add the options to the plan."
          : "Select a whole card, inspect its details, then confirm your preferred option."}
      </p>
      {expanded && state.shelters.find((s) => s.id === expanded) && (
        <ShelterDetails
          s={state.shelters.find((s) => s.id === expanded)!}
          onClose={() => setExpanded(null)}
        />
      )}
      <div className="demo-done-grid">
        {options.map((s, i) => (
          <section
            className={`a2s-sheet demo-option ${c.best === s.id ? "best" : ""} ${candidate === s.id ? "candidate" : ""}`}
            key={s.id}
          >
            <button
              type="button"
              className="workflow-card-select"
              aria-label={
                c.best === s.id
                  ? `${s.name}, current best fit`
                  : `Select ${s.name} for review`
              }
              aria-pressed={candidate === s.id || c.best === s.id}
              onClick={() => {
                if (c.best !== s.id) setCandidate(s.id);
              }}
            />
            <div className="demo-option-top">
              <strong>{s.walk} min</strong>
              {c.best === s.id && <span className="a2s-badge">Locked in</span>}
            </div>
            <small>walk to the station</small>
            <h2>{s.name}</h2>
            <ShelterTags s={s} />
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
              aria-expanded={expanded === s.id}
              aria-controls="shelter-expanded"
              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
            >
              {expanded === s.id ? "Hide shelter details" : "Shelter details"}
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
        {c.callback && c.best && (
          <Button
            onClick={() => {
              const service = state.shelters.find((s) => s.id === c.best);
              if (!service || !downloadCalendar(c, service))
                notify(
                  "Edit the mock callback and choose a date and time before downloading.",
                );
            }}
          >
            Add callback to calendar
          </Button>
        )}
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
            notify(
              "Three shelter options added. Next: open the plan and review them with the client.",
            );
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
