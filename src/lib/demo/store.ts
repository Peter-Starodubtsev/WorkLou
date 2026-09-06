import { MY_CLIENTS, MAYA, PLAN, QUICK_EXIT } from "../a2-mock";

export type Item = {
  id: string;
  title: string;
  detail: string;
  done?: boolean;
  group?: string;
};
export type RecordFile = {
  id: string;
  title: string;
  body: string;
  kind: "note" | "letter" | "message";
  date: string;
};
export type Client = {
  id: string;
  name: string;
  ref: string;
  focus: string;
  stage: string;
  last: string;
  next: string;
  overdue: boolean;
  waiting: boolean;
  attention: boolean;
  summary: string;
  chips: string[];
  suggestions: string[];
  actions: Item[];
  quick: Item[];
  files: RecordFile[];
  reviews: string[];
  events: string[];
  run?: {
    ask: string;
    status: "working" | "done";
    decision?: "sent" | "skipped";
    draft: string;
  };
  best?: string;
  callback?: string;
  callbackAt?: string;
  dismissedSafety?: boolean;
};
export type Shelter = {
  id: string;
  name: string;
  area: string;
  takes: string;
  beds: number | null;
  checked: string;
  pets: boolean;
  children: boolean;
  noCurfew: boolean;
  nilIncome: boolean;
  walk: number;
};
export type Alert = {
  id: string;
  clientId: string;
  title: string;
  read: boolean;
  section: string;
};
export type State = {
  version: 1;
  clients: Client[];
  shelters: Shelter[];
  alerts: Alert[];
  discoveries: string[];
};
export const STORAGE_KEY = "worklou-claude-mock-v1";
export const clientPath = (id: string, section = "") =>
  `/clients/${id}${section ? `/${section}` : ""}`;
export const firstName = (c: Client) => c.name.split(" ")[0];
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("");
export function seedState(): State {
  const clients: Client[] = MY_CLIENTS.rows.map((row, i) => {
    const id = row.name.split(" ")[0].toLowerCase(),
      first = row.name.split(" ")[0],
      maya = i === 0;
    return {
      id,
      name: row.name,
      ref: `LP-${String(248 + i).padStart(4, "0")}`,
      focus: row.focus,
      stage: row.stage,
      last: row.last,
      next: row.next,
      overdue: !!row.nextOverdue,
      waiting: [1, 4, 5].includes(i),
      attention: [0, 1, 2].includes(i),
      summary: maya
        ? MAYA.summary.body
        : `${first} is working with Hannah on ${row.focus.toLowerCase()}. The next agreed step is ${row.stage.toLowerCase()}. This is a synthetic case for reviewing the client journey.`,
      chips: maya
        ? MAYA.chips
        : [row.focus, "Inner West", "Safe phone · confirmed"],
      suggestions: maya
        ? ["Domestic violence", "Homelessness", "Dog", "Shared bank account"]
        : [row.focus],
      actions: maya
        ? PLAN.groups
            .filter((g) => g.label !== "Declined")
            .flatMap((g) =>
              g.items.map((x, j) => ({
                id: `${g.label}-${j}`,
                title: x.name,
                detail: x.detail,
                group: g.label,
                done: /done|in place|sent 28/.test(x.detail),
              })),
            )
        : [
            {
              id: "next",
              title: row.stage,
              detail: "Agreed with client · Hannah",
              group: "Next steps",
              done: false,
            },
          ],
      quick: maya
        ? QUICK_EXIT.items.map((x, j) => ({
            id: `quick-${j}`,
            title: x.name,
            detail: x.detail,
            done: [1, 5].includes(j),
          }))
        : [
            "Safe place tonight",
            "Safe phone",
            "Money",
            "Transport",
            "Who to call",
            "Bag",
            "Signal",
          ].map((title, j) => ({
            id: `quick-${j}`,
            title,
            detail:
              j === 1
                ? "Safe phone confirmed with client"
                : "To review together",
            done: j === 1,
          })),
      files: [
        {
          id: `note-${id}`,
          title: "Contact note",
          kind: "note",
          date: "Today 09:25",
          body: maya
            ? "Maya phoned about safe housing for herself and Biscuit. No curfew; near transport and her sister in Marrickville. Safe phone confirmed."
            : `${first} discussed ${row.focus.toLowerCase()}. Agreed next step: ${row.stage}.`,
        },
        ...([0, 3].includes(i)
          ? [
              {
                id: `letter-${id}`,
                title: maya
                  ? "Support letter · Housing NSW"
                  : "Referral letter",
                kind: "letter" as const,
                date: "Draft",
                body: `Draft support letter for ${row.name}.\n\nWe are supporting ${first} with ${row.focus.toLowerCase()}. Please review the agreed plan and consider the support requested.\n\nHannah Lee · Lou’s Place\nSynthetic preview — not for sending.`,
              },
            ]
          : []),
      ],
      reviews: maya
        ? PLAN.reviewed.items.slice(1).map((x) => `${x.when} · ${x.what}`)
        : ["Yesterday · plan discussed with client"],
      events: ["Demo case opened · Hannah"],
      ...(maya
        ? {
            run: {
              ask: "Find pet-friendly housing for Maya in the Inner West, close to transport.",
              status: "working" as const,
              draft:
                "Hi Maya, I have a shortlist of places near transport. Can you confirm Biscuit’s size and whether no curfew is still essential? I will arrange a callback once you are happy with an option.",
            },
          }
        : {}),
    };
  });
  return {
    version: 1,
    clients,
    discoveries: [],
    alerts: [
      {
        id: "a1",
        clientId: "maya",
        title: "Overdue · Maya’s housing follow-up · 09:00",
        read: false,
        section: "referrals",
      },
      {
        id: "a2",
        clientId: "jasmine",
        title: "Reply · Link2Home answered Jasmine’s referral · 09:12",
        read: false,
        section: "referrals",
      },
      {
        id: "a3",
        clientId: "maya",
        title: "Capacity · Harbour House · 1 mock bed · 09:10",
        read: false,
        section: "shelters",
      },
    ],
    shelters: [
      {
        id: "harbour",
        name: "Harbour House",
        area: "Marrickville",
        takes: "Women · pets · curfew 11 pm",
        beds: 1,
        checked: "called 09:10",
        pets: true,
        children: false,
        noCurfew: false,
        nilIncome: false,
        walk: 6,
      },
      {
        id: "bridgewell",
        name: "Bridgewell",
        area: "Ashfield",
        takes: "Women + children · pets · no curfew",
        beds: 0,
        checked: "emailed yesterday",
        pets: true,
        children: true,
        noCurfew: true,
        nilIncome: true,
        walk: 11,
      },
      {
        id: "cedar",
        name: "Cedar Family Support",
        area: "Leichhardt",
        takes: "Women + children · pet policy unconfirmed",
        beds: null,
        checked: "last confirmed 12 days ago",
        pets: false,
        children: true,
        noCurfew: true,
        nilIncome: true,
        walk: 4,
      },
      {
        id: "elsie",
        name: "Elsie Refuge",
        area: "Glebe",
        takes: "Women + children only",
        beds: 2,
        checked: "called 08:50",
        pets: false,
        children: true,
        noCurfew: false,
        nilIncome: true,
        walk: 7,
      },
      {
        id: "rosa",
        name: "Rosa House",
        area: "Newtown",
        takes: "Women · no pets",
        beds: 0,
        checked: "called yesterday",
        pets: false,
        children: false,
        noCurfew: true,
        nilIncome: false,
        walk: 9,
      },
      {
        id: "link",
        name: "Link2Home",
        area: "Statewide",
        takes: "Referral line",
        beds: null,
        checked: "directory · yesterday",
        pets: false,
        children: false,
        noCurfew: true,
        nilIncome: true,
        walk: 0,
      },
      {
        id: "bonnie",
        name: "Bonnie Support",
        area: "Marrickville",
        takes: "Women · pets · nil income · no curfew",
        beds: 0,
        checked: "emailed 3 Sep",
        pets: true,
        children: false,
        noCurfew: true,
        nilIncome: true,
        walk: 8,
      },
      {
        id: "northern",
        name: "Northern Beaches Refuge",
        area: "Manly",
        takes: "Women + children only",
        beds: null,
        checked: "last week",
        pets: false,
        children: true,
        noCurfew: false,
        nilIncome: true,
        walk: 15,
      },
    ],
  };
}
export function searchClients(s: State, query: string) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return s.clients;
  return s.clients.filter((c) =>
    words.every((w) =>
      `${c.name} ${c.ref} ${c.focus}`.toLowerCase().includes(w),
    ),
  );
}
export const escapePattern = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export function inferClient(s: State, query: string): Client | undefined {
  const q = query.toLowerCase();
  const found = s.clients.filter(
    (c) =>
      q.includes(c.name.toLowerCase()) ||
      new RegExp(`\\b${escapePattern(firstName(c).toLowerCase())}\\b`).test(
        q,
      ) ||
      q.includes(c.ref.toLowerCase()),
  );
  return found.length === 1 ? found[0] : undefined;
}
export function filterClients(s: State, filter: string) {
  return s.clients.filter((c) =>
    filter === "Overdue"
      ? c.overdue
      : filter === "Waiting on service"
        ? c.waiting
        : filter === "Running"
          ? c.run?.status === "working"
          : true,
  );
}
export function eligibility(s: Shelter, query: string) {
  const q = query.toLowerCase();
  if (/no curfew/.test(q) && !s.noCurfew) return "Not eligible · curfew";
  if (/dog|pet/.test(q) && !s.pets) return "Not eligible · pet policy";
  if (/no children/.test(q) && ["elsie", "northern"].includes(s.id))
    return "Not eligible · children required";
  if (/nil income/.test(q) && !s.nilIncome) return "Not eligible · income";
  if (/inner west/.test(q) && s.area === "Manly")
    return "Not eligible · outside area";
  if (s.id === "link") return "Referral line · no direct beds";
  return s.beds === 0
    ? "Eligible · no bed"
    : s.beds === null
      ? "Eligible · confirm capacity"
      : "Eligible";
}
export type Action =
  | { type: "add-client"; client: Client }
  | {
      type: "edit-client";
      clientId: string;
      changes: Pick<Client, "name" | "focus" | "summary" | "chips">;
    }
  | { type: "toggle-quick"; clientId: string; id: string }
  | { type: "edit-quick"; clientId: string; id: string; detail: string }
  | { type: "file"; clientId: string; file: RecordFile }
  | { type: "run"; clientId: string; ask: string }
  | {
      type: "finish";
      clientId: string;
      decision: "sent" | "skipped";
      draft: string;
      id: string;
      date: string;
    }
  | { type: "choose"; clientId: string; shelterId: string }
  | { type: "callback"; clientId: string; date: string; startsAt?: string }
  | { type: "action"; clientId: string; item: Item }
  | { type: "toggle-action"; clientId: string; id: string }
  | { type: "suggestion"; clientId: string; name: string }
  | { type: "review"; clientId: string; text: string }
  | { type: "dismiss-safety"; clientId: string }
  | { type: "resolve"; clientId: string }
  | { type: "read"; id?: string }
  | { type: "discover"; name: string };
export function reducer(state: State, a: Action): State {
  if (a.type === "read")
    return {
      ...state,
      alerts: state.alerts.map((x) =>
        !a.id || x.id === a.id ? { ...x, read: true } : x,
      ),
    };
  if (a.type === "discover")
    return { ...state, discoveries: [...state.discoveries, a.name] };
  if (a.type === "add-client")
    return {
      ...state,
      clients: [...state.clients, a.client],
      alerts: [
        {
          id: `new-${a.client.id}`,
          clientId: a.client.id,
          title: `New client · ${a.client.name}`,
          read: false,
          section: "",
        },
        ...state.alerts,
      ],
    };
  if (!state.clients.some((c) => c.id === a.clientId)) return state;
  const clients = state.clients.map((c) => {
    if (c.id !== a.clientId) return c;
    switch (a.type) {
      case "edit-client":
        if (!a.changes.name.trim() || !a.changes.focus.trim()) return c;
        return {
          ...c,
          ...a.changes,
          name: a.changes.name.trim(),
          focus: a.changes.focus.trim(),
          events: [
            "Client information updated · reviewed by worker",
            ...c.events,
          ],
        };
      case "toggle-quick":
        return {
          ...c,
          quick: c.quick.map((item) =>
            item.id === a.id ? { ...item, done: !item.done } : item,
          ),
        };
      case "edit-quick":
        return {
          ...c,
          quick: c.quick.map((item) =>
            item.id === a.id
              ? { ...item, detail: a.detail.trim(), done: false }
              : item,
          ),
          events: ["Quick exit details updated · review together", ...c.events],
        };

      case "file":
        return {
          ...c,
          files: [a.file, ...c.files.filter((f) => f.id !== a.file.id)],
          last: "just now",
          events: [
            `${a.file.kind === "note" ? "Case note" : "Document"} saved · ${a.file.title}`,
            ...c.events,
          ],
        };
      case "run":
        return {
          ...c,
          run: {
            ask: a.ask,
            status: "working" as const,
            draft: `Hi ${firstName(c)}, I have reviewed your request: ${a.ask} Please confirm your preferences before we contact any service.`,
          },
          events: ["Started a mock task", ...c.events],
        };
      case "finish":
        if (c.run?.status === "done") return c;
        return {
          ...c,
          run: {
            ask: c.run?.ask || "Review housing options",
            status: "done" as const,
            decision: a.decision,
            draft: a.draft,
          },
          files:
            a.decision === "sent"
              ? [
                  {
                    id: a.id,
                    title: "Shortlist message · simulated",
                    kind: "message" as const,
                    date: a.date,
                    body: a.draft,
                  },
                  ...c.files,
                ]
              : c.files,
          events: [
            a.decision === "sent"
              ? "Message simulated · saved to file · nothing transmitted"
              : "Message skipped · nothing sent",
            "Shortlist prepared from mock directory",
            ...c.events,
          ],
        };
      case "choose":
        return {
          ...c,
          best: a.shelterId,
          events: [
            `Best fit confirmed · ${state.shelters.find((s) => s.id === a.shelterId)?.name}`,
            ...c.events,
          ],
        };
      case "callback":
        if (!c.best) return c;
        return {
          ...c,
          callback: a.date,
          callbackAt: a.startsAt,
          overdue: false,
          attention: false,
          next: a.date,
          waiting: true,
          stage: "Callback booked · simulation",
          events: [`Callback simulated · ${a.date}`, ...c.events],
        };
      case "action":
        return {
          ...c,
          actions: c.actions.some((x) => x.id === a.item.id)
            ? c.actions
            : [...c.actions, a.item],
        };
      case "toggle-action":
        return {
          ...c,
          actions: c.actions.map((x) =>
            x.id === a.id ? { ...x, done: !x.done } : x,
          ),
        };
      case "suggestion":
        return {
          ...c,
          suggestions: c.suggestions.includes(a.name)
            ? c.suggestions.filter((x) => x !== a.name)
            : [...c.suggestions, a.name],
        };
      case "review":
        return {
          ...c,
          reviews: [a.text, ...c.reviews],
          events: ["Plan reviewed together", ...c.events],
        };
      case "dismiss-safety":
        return { ...c, dismissedSafety: true };
      case "resolve":
        return {
          ...c,
          overdue: false,
          waiting: false,
          attention: false,
          next: "Reviewed today",
          events: ["Follow-up marked reviewed", ...c.events],
        };
    }
  });
  const alerts = ["file", "finish", "callback", "review"].includes(a.type)
    ? [
        {
          id: `event-${a.clientId}-${state.alerts.length}`,
          clientId: a.clientId,
          title: `${clients.find((c) => c.id === a.clientId)?.name} · ${a.type === "file" ? "New file saved" : a.type === "finish" ? "Shortlist ready" : a.type === "callback" ? "Callback simulated" : "Plan reviewed"}`,
          read: false,
          section:
            a.type === "finish"
              ? "done"
              : a.type === "file"
                ? a.file.kind === "letter"
                  ? "letters"
                  : a.file.kind === "message"
                    ? "referrals"
                    : "notes"
                : a.type === "review"
                  ? "plan"
                  : "referrals",
        },
        ...state.alerts,
      ]
    : state.alerts;
  return { ...state, clients, alerts };
}
