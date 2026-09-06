"use client";
import { clientPath } from "../../lib/demo/store";
import { useDemo } from "./context";
import { TextButton } from "./ui";
import "./alerts.css";
export function AlertPanel() {
  const { state, dispatch, go } = useDemo(),
    unread = state.alerts.filter((a) => !a.read);
  return (
    <section className="a2s-pop demo-alert-panel" aria-label="Alerts">
      <header>
        <h3>Alerts</h3>
        <span className="a2s-badge">{unread.length}</span>
      </header>
      <div className="demo-alert-list">
        {unread.map((a) => {
          const parts = a.title.split(" · "),
            kind = parts[0];
          return (
            <button
              key={a.id}
              className="demo-alert-item"
              onClick={() => {
                dispatch({ type: "read", id: a.id });
                go(clientPath(a.clientId, a.section));
              }}
            >
              <span
                className={`demo-alert-mark ${kind === "Overdue" ? "urgent" : ""}`}
                aria-hidden="true"
              />
              <span className="demo-alert-copy">
                <b>{parts.length > 1 ? parts.slice(1).join(" · ") : a.title}</b>
                <small>
                  {kind} · {state.clients.find((c) => c.id === a.clientId)?.ref}
                </small>
              </span>
              <span className="demo-alert-open">Open</span>
            </button>
          );
        })}
        {!unread.length && <p className="demo-empty">You’re all caught up.</p>}
      </div>
      {!!unread.length && (
        <footer>
          <TextButton onClick={() => dispatch({ type: "read" })}>
            Mark all read
          </TextButton>
        </footer>
      )}
    </section>
  );
}
