"use client";
import { useEffect, useReducer, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  reducer,
  seedState,
  STORAGE_KEY,
  clientPath,
  firstName,
} from "../../lib/demo/store";
import type { State } from "../../lib/demo/store";
import { DemoContext } from "./context";
import type { ModalState } from "./context";
import { Asset, Button, TextButton, Heading } from "./ui";
import {
  Today,
  Clients,
  Profile,
  Plan,
  Files,
  Referrals,
  States,
} from "./screens";
import { Shelters, Working, Done } from "./workflow";
import { Modals, Spotlight } from "./interactions";
import { QuickExitPage } from "./QuickExitPage";
import { AlertPanel } from "./AlertPanel";

export function DemoApp() {
  const router = useRouter(),
    pathname = usePathname() || "/today";
  const [state, dispatchBase] = useReducer(
    (
      s: State,
      a: Parameters<typeof reducer>[1] | { type: "hydrate"; state: State },
    ) => (a.type === "hydrate" ? a.state : reducer(s, a)),
    undefined,
    seedState,
  );
  const [ready, setReady] = useState(false),
    [modal, setModal] = useState<ModalState>(null),
    [spotlight, setSpotlight] = useState(false),
    [menu, setMenu] = useState<"alerts" | "identity" | null>(null),
    [toast, setToast] = useState("");
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (
          saved.version === 1 &&
          Array.isArray(saved.clients) &&
          Array.isArray(saved.alerts) &&
          Array.isArray(saved.shelters)
        )
          dispatchBase({ type: "hydrate", state: saved });
      }
    } catch {
      setToast(
        "Local saved preview could not be loaded; showing the seed data.",
      );
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        setToast(
          "Browser storage is unavailable. Changes will last for this tab only.",
        );
      }
  }, [state, ready]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const saved = JSON.parse(event.newValue);
        if (saved.version === 1 && Array.isArray(saved.clients))
          dispatchBase({ type: "hydrate", state: saved });
      } catch {
        /* Keep the current session if a stored value is invalid. */
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    setMenu(null);
    setModal(null);
    setSpotlight(false);
  }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSpotlight((v) => !v);
      }
      if (e.key === "Escape") setMenu(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const go = (url: string) => {
    setMenu(null);
    setSpotlight(false);
    setModal(null);
    router.push(url);
  };
  const path = pathname.replace(/^\/mock-preview/, "") || "/today",
    parts = path.split("/").filter(Boolean),
    id = parts[0] === "clients" && parts[1] !== "new" ? parts[1] : undefined;
  const client = state.clients.find((c) => c.id === id),
    section = parts[2] || "profile";
  const active =
    client || ["working", "done"].includes(parts[0])
      ? "/clients"
      : `/${parts[0]}`;
  const unread = state.alerts.filter((a) => !a.read).length;
  let content;
  if (!ready) content = <Heading title="Opening your preview…" />;
  else if (client) {
    switch (section) {
      case "profile":
        content = <Profile c={client} />;
        break;
      case "plan":
        content = <Plan c={client} />;
        break;
      case "shelters":
        content = <Shelters c={client} />;
        break;
      case "working":
        content = <Working c={client} />;
        break;
      case "done":
        content = <Done c={client} />;
        break;
      case "referrals":
        content = <Referrals c={client} />;
        break;
      case "notes":
      case "letters":
        content = <Files c={client} kind={section} />;
        break;
      case "quick-exit":
        content = <QuickExitPage c={client} />;
        break;
      default:
        content = (
          <Heading title="Section not found">
            <Button onClick={() => go(clientPath(client.id))}>
              Open profile
            </Button>
          </Heading>
        );
    }
  } else if (id)
    content = (
      <Heading title="Client not found" sub="Choose a client from My clients.">
        <Button onClick={() => go("/clients")}>My clients</Button>
      </Heading>
    );
  else
    switch (parts[0]) {
      case "today":
        content = <Today />;
        break;
      case "clients":
        content = <Clients create={parts[1] === "new"} />;
        break;
      case "shelters":
        content = <Shelters />;
        break;
      case "plans":
        content = <Clients plans />;
        break;
      case "letters":
        content = <Files kind="letters" />;
        break;
      case "follow-ups":
        content = <Referrals />;
        break;
      case "working":
      case "done":
        content = <Clients />;
        break;
      case "states":
        content = <States />;
        break;
      default:
        content = <Today />;
    }
  return (
    <DemoContext.Provider
      value={{
        state,
        dispatch: dispatchBase,
        modal: setModal,
        notify: setToast,
        go,
      }}
    >
      <div className="a2s demo">
        <div className="a2s-page">
          <img
            className="demo-backdrop"
            src="/figma-claude/backdrop.svg"
            width="1440"
            height="1000"
            alt=""
          />
          <div className="a2s-shell demo-shell">
            <nav className="a2s-nav a2s-matte" aria-label="Main navigation">
              <Link
                href="/today"
                aria-label="Lou’s Place home"
                className="demo-logo"
              >
                <Asset name="logo" size={48} width={62.9091} />
              </Link>
              {[
                ["Today", "/today"],
                ["My clients", "/clients"],
                ["Shelters", "/shelters"],
                ["Plans", "/plans"],
                ["Letters", "/letters"],
                ["Follow-ups", "/follow-ups"],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={active === href ? "page" : undefined}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="a2s-island a2s-matte">
              <button
                className="a2s-island-btn"
                aria-label="Search everything"
                onClick={() => setSpotlight(true)}
              >
                <Asset name="search" />
              </button>
              <span className="a2s-pop-wrap">
                <button
                  className="a2s-island-btn"
                  aria-expanded={menu === "alerts"}
                  onClick={() => setMenu(menu === "alerts" ? null : "alerts")}
                >
                  Alerts{" "}
                  {unread > 0 && <span className="a2s-badge">{unread}</span>}
                </button>
                {menu === "alerts" && <AlertPanel />}
              </span>
              <span className="a2s-pop-wrap">
                <button
                  className="a2s-island-btn"
                  aria-expanded={menu === "identity"}
                  onClick={() =>
                    setMenu(menu === "identity" ? null : "identity")
                  }
                >
                  <span className="a2s-avatar">HL</span>
                  <span className="a2s-identity">
                    <b>Hannah Lee</b>
                    <span>Caseworker</span>
                  </span>
                </button>
                {menu === "identity" && (
                  <div className="a2s-pop">
                    <p>Hannah Lee · Demo caseworker</p>
                    <Button onClick={() => go("/today")}>My day</Button>
                    <Button
                      onClick={() => {
                        setMenu(null);
                        setModal({ type: "settings" });
                      }}
                    >
                      Preview settings
                    </Button>
                  </div>
                )}
              </span>
            </div>
          </div>
          {client && (
            <div className="a2s-clientbar demo-context">
              <b>
                {client.name} · {client.ref}
              </b>
              <nav aria-label="Client sections">
                {[
                  ["Profile", ""],
                  ["Quick exit", "quick-exit"],
                  ["Plan", "plan"],
                  ["Shelters", "shelters"],
                  ["Referrals", "referrals"],
                  ["Notes", "notes"],
                  ["Letters", "letters"],
                ].map(([label, key]) => (
                  <Link
                    key={label}
                    href={clientPath(client.id, key)}
                    aria-current={
                      section === key ||
                      (!key && section === "profile") ||
                      (key === "shelters" &&
                        ["working", "done"].includes(section))
                        ? "page"
                        : undefined
                    }
                  >
                    <span
                      className={`demo-dot ${["Plan", "Referrals"].includes(label) ? "orange" : ""}`}
                    />
                    {label}
                  </Link>
                ))}
              </nav>
              <TextButton
                className="orange"
                onClick={() => go(clientPath(client.id, "quick-exit"))}
              >
                Quick exit plan
              </TextButton>
            </div>
          )}
          <main key={path}>{content}</main>
          <footer className="demo-footer">
            <span>
              Mock preview · synthetic data · saved in this browser · nothing is
              transmitted
            </span>
            <TextButton onClick={() => setModal({ type: "reset" })}>
              Reset demo
            </TextButton>
          </footer>
          {toast && (
            <div role="status" className="demo-toast">
              {toast}
            </div>
          )}
          {modal && (
            <Modals
              key={`${modal.type}-${modal.clientId}-${modal.file?.id}`}
              value={modal}
              close={() => setModal(null)}
              reset={() => {
                dispatchBase({ type: "hydrate", state: seedState() });
                go("/today");
                setToast("Demo reset to the Figma examples.");
              }}
            />
          )}
          {spotlight && <Spotlight close={() => setSpotlight(false)} />}
        </div>
      </div>
    </DemoContext.Provider>
  );
}
