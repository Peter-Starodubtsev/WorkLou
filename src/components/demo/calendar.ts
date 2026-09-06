import type { Client, Shelter } from "../../lib/demo/store";

const escapeText = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
const utc = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
// Fold at 73 UTF-8 bytes so long client/service names remain valid calendar lines.
function fold(line: string) {
  const parts: string[] = [];
  let current = "",
    size = 0;
  for (const character of line) {
    const bytes = new TextEncoder().encode(character).length;
    if (size + bytes > 73) {
      parts.push(current);
      current = " ";
      size = 1;
    }
    current += character;
    size += bytes;
  }
  parts.push(current);
  return parts.join("\r\n");
}
export function callbackCalendar(c: Client, s: Shelter): string | null {
  if (!c.callbackAt) return null;
  const start = new Date(c.callbackAt);
  if (!Number.isFinite(start.getTime())) return null;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WorkLou//Mock preview//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${escapeText(`${c.id}-${start.getTime()}@worklou-preview`)}`,
    `DTSTAMP:${utc(new Date())}`,
    `DTSTART:${utc(start)}`,
    `DTEND:${utc(new Date(start.getTime() + 30 * 60000))}`,
    "CLASS:PRIVATE",
    "STATUS:TENTATIVE",
    `SUMMARY:${escapeText(`Mock callback: ${c.name} · ${s.name}`)}`,
    `DESCRIPTION:${escapeText("Synthetic preview reminder. Confirm the time with the service. No booking or invitation has been sent.")}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ]
    .map(fold)
    .join("\r\n");
}
export function downloadCalendar(c: Client, s: Shelter): boolean {
  const calendar = callbackCalendar(c, s);
  if (!calendar) return false;
  const url = URL.createObjectURL(
    new Blob([calendar], { type: "text/calendar;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "worklou-mock-callback.ics";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
