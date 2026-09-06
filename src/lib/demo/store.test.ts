import assert from "node:assert/strict";
import {
  seedState,
  reducer,
  searchClients,
  inferClient,
  filterClients,
  eligibility,
} from "./store";
let checks = 0;
function test(name: string, fn: () => void) {
  fn();
  checks++;
  console.log("PASS", name);
}
test("search supports full names, partial names and LP references", () => {
  const s = seedState();
  assert.equal(searchClients(s, "Maya Thompson")[0].id, "maya");
  assert.equal(searchClients(s, "LP-0249")[0].id, "jasmine");
  assert.equal(searchClients(s, "not-a-person").length, 0);
  assert.equal(inferClient(s, "Find housing for Maya")?.id, "maya");
});
test("client filters return different meaningful subsets", () => {
  const s = seedState();
  assert.equal(filterClients(s, "All").length, 8);
  assert.deepEqual(
    filterClients(s, "Overdue").map((c) => c.id),
    ["maya", "grace"],
  );
  assert.equal(filterClients(s, "Waiting on service").length, 3);
  assert.equal(filterClients(s, "Running").length, 1);
});
test("note is saved to only the selected client and produces an alert", () => {
  const s = seedState();
  const next = reducer(s, {
    type: "file",
    clientId: "jasmine",
    file: {
      id: "new-note",
      title: "Review",
      body: "Client agreed next step",
      kind: "note",
      date: "Now",
    },
  });
  assert.equal(next.clients[1].files[0].id, "new-note");
  assert.deepEqual(next.clients[0], s.clients[0]);
  assert.equal(next.alerts[0].clientId, "jasmine");
  assert.equal(next.alerts[0].read, false);
});
test("run, edited approval and completion produce client-specific persisted history", () => {
  let s = seedState();
  s = reducer(s, {
    type: "run",
    clientId: "jasmine",
    ask: "Find housing for Jasmine",
  });
  s = reducer(s, {
    type: "finish",
    clientId: "jasmine",
    decision: "sent",
    draft: "Edited and approved message",
    id: "msg",
    date: "Now",
  });
  const c = s.clients[1];
  assert.equal(c.run?.status, "done");
  assert.equal(c.files[0].body, "Edited and approved message");
  assert.equal(s.clients[0].run?.status, "working");
  assert.deepEqual(JSON.parse(JSON.stringify(s)).clients[1], c);
  assert.equal(
    reducer(s, {
      type: "finish",
      clientId: "jasmine",
      decision: "sent",
      draft: "Duplicate",
      id: "dup",
      date: "Now",
    }).clients[1].files.length,
    c.files.length,
  );
});
test("skip completes the flow without creating a sent message", () => {
  const s = seedState();
  const next = reducer(s, {
    type: "finish",
    clientId: "maya",
    decision: "skipped",
    draft: "Not approved",
    id: "skip",
    date: "Now",
  });
  assert.equal(next.clients[0].files.length, s.clients[0].files.length);
  assert.equal(next.clients[0].run?.decision, "skipped");
});
test("booking needs an explicit choice and updates Today/filter state", () => {
  let s = seedState();
  assert.equal(
    reducer(s, { type: "callback", clientId: "maya", date: "Tomorrow" })
      .clients[0].callback,
    undefined,
  );
  s = reducer(s, { type: "choose", clientId: "maya", shelterId: "bridgewell" });
  s = reducer(s, {
    type: "callback",
    clientId: "maya",
    date: "Tomorrow 14:00",
  });
  assert.equal(s.clients[0].callback, "Tomorrow 14:00");
  assert.equal(
    filterClients(s, "Overdue").some((c) => c.id === "maya"),
    false,
  );
  assert.equal(s.clients[0].attention, false);
  assert.equal(s.clients[0].waiting, true);
});
test("plan changes persist and duplicate shortlist additions are idempotent", () => {
  let s = seedState();
  const a = {
    type: "action" as const,
    clientId: "maya",
    item: { id: "new", title: "Review shelter", detail: "Together" },
  };
  s = reducer(reducer(s, a), a);
  assert.equal(s.clients[0].actions.filter((x) => x.id === "new").length, 1);
  s = reducer(s, { type: "toggle-action", clientId: "maya", id: "new" });
  assert.equal(s.clients[0].actions.find((x) => x.id === "new")?.done, true);
});
test("read alerts and resolved follow-ups stay resolved", () => {
  let s = seedState();
  s = reducer(s, { type: "read" });
  assert.equal(s.alerts.filter((a) => !a.read).length, 0);
  s = reducer(s, { type: "resolve", clientId: "grace" });
  assert.equal(
    filterClients(s, "Waiting on service").some((c) => c.id === "grace"),
    false,
  );
});
test("no-curfew and pets exclude incompatible shelters", () => {
  const s = seedState();
  assert.equal(
    eligibility(s.shelters[0], "dog, no curfew"),
    "Not eligible · curfew",
  );
  assert.equal(
    eligibility(s.shelters[1], "dog, no curfew"),
    "Eligible · no bed",
  );
  assert.match(eligibility(s.shelters[4], "dog"), /Not eligible/);
});
test("new client becomes searchable and has its own alert", () => {
  const s = seedState(),
    c = {
      ...s.clients[6],
      id: "new-client",
      name: "Test Person",
      ref: "LP-0300",
    };
  const next = reducer(s, { type: "add-client", client: c });
  assert.equal(searchClients(next, "LP-0300")[0].id, "new-client");
  assert.equal(next.alerts[0].clientId, "new-client");
});
test("ambiguous and punctuation-bearing names need a deliberate client choice", () => {
  const s = seedState();
  assert.equal(inferClient(s, "Find housing for Maya and Jasmine"), undefined);
  s.clients.push({
    ...s.clients[6],
    id: "bracket",
    name: "[Test Person",
    ref: "LP-0400",
  });
  assert.doesNotThrow(() => inferClient(s, "Find housing for Maya"));
  assert.equal(inferClient(s, "LP-0400")?.id, "bracket");
});
console.log(`${checks} workflow checks passed`);
