"use client";
import { useState } from "react";
import Link from "next/link";
import { clientPath, firstName } from "../../lib/demo/store";
import type { Client, Item } from "../../lib/demo/store";
import { Sheet } from "../a2/Sheet";
import { useDemo } from "./context";
import { Asset, Button, Heading, TextButton } from "./ui";
import "./quick-exit.css";

export function QuickExitPage({ c }: { c: Client }) {
  const { dispatch, notify, modal } = useDemo();
  const completed = c.quick.filter((x) => x.done).length;
  return (
    <div className="quick-exit-page">
      <Heading
        title={`${firstName(c)}’s quick exit plan`}
        sub="A personal safety plan, when she needs one. Review each detail together."
      />
      <div className="a2s-grid">
        <Sheet
          title="Ready when she needs it"
          action={
            <small>
              {completed} of {c.quick.length} confirmed
            </small>
          }
        >
          <progress
            aria-label="Confirmed safety details"
            value={completed}
            max={c.quick.length}
          />
          <div className="quick-exit-items">
            {c.quick.map((item) => (
              <QuickItem key={item.id} item={item} clientId={c.id} />
            ))}
          </div>
          <small>
            This is her safety plan, not a standard intake checklist. Keep only
            details she agrees to.
          </small>
        </Sheet>
        <aside>
          <Sheet title="Next step">
            <p>
              Review the unconfirmed details with {firstName(c)} and mark what
              she is comfortable with.
            </p>
            <div className="demo-actions">
              <Button
                icon="plus"
                onClick={() => modal({ type: "review", clientId: c.id })}
              >
                Record a review
              </Button>
              <Button icon="print" onClick={() => window.print()}>
                Print to PDF
              </Button>
            </div>
          </Sheet>
          <Sheet title="Share only when agreed">
            <p>Use her confirmed safe contact method.</p>
            <Button
              tone="orange-button"
              onClick={() => {
                dispatch({
                  type: "file",
                  clientId: c.id,
                  file: {
                    id: crypto.randomUUID(),
                    title: "Quick exit plan · simulated message",
                    kind: "message",
                    body: c.quick
                      .map(
                        (x) =>
                          `${x.title}: ${x.detail} (${x.done ? "confirmed" : "to review"})`,
                      )
                      .join("\n"),
                    date: new Date().toLocaleString("en-AU"),
                  },
                });
                notify(
                  "Simulated safe-phone message saved to her file. Nothing transmitted.",
                );
              }}
            >
              Send to safe phone · simulate
            </Button>
            <div className="demo-actions">
              <Link href={clientPath(c.id, "notes")}>Open saved messages</Link>
              <Link href={clientPath(c.id, "plan")}>Back to her plan</Link>
            </div>
          </Sheet>
        </aside>
      </div>
    </div>
  );
}
function QuickItem({ item, clientId }: { item: Item; clientId: string }) {
  const { dispatch, notify } = useDemo(),
    [editing, setEditing] = useState(false),
    [detail, setDetail] = useState(item.detail);
  return (
    <section className="quick-exit-item">
      <div className="quick-exit-item-head">
        <label>
          <input
            type="checkbox"
            checked={!!item.done}
            onChange={() =>
              dispatch({ type: "toggle-quick", clientId, id: item.id })
            }
          />
          <b>{item.title}</b>
        </label>
        <span className={item.done ? "demo-green" : "demo-muted"}>
          {item.done ? "Confirmed together" : "To review"}
        </span>
      </div>
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!detail.trim()) return;
            dispatch({ type: "edit-quick", clientId, id: item.id, detail });
            setEditing(false);
            notify("Plan detail saved. Confirm it together when ready.");
          }}
        >
          <label className="demo-label" htmlFor={`quick-${item.id}`}>
            Agreed details
          </label>
          <textarea
            id={`quick-${item.id}`}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={2}
          />
          <div className="demo-actions">
            <Button type="submit" tone="dark" disabled={!detail.trim()}>
              Save detail
            </Button>
            <TextButton
              onClick={() => {
                setEditing(false);
                setDetail(item.detail);
              }}
            >
              Cancel
            </TextButton>
          </div>
        </form>
      ) : (
        <div className="quick-exit-item-body">
          <p>{item.detail}</p>
          <TextButton onClick={() => setEditing(true)}>Edit</TextButton>
        </div>
      )}
    </section>
  );
}
