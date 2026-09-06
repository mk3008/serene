import type { Driver } from "./contracts";

export const shipmentQueryLabel = "shipment query";

export function previewPlan(driver: Driver) {
  return driver.prepare("select id from shipments where dock = ?");
}

export function renderSqlBadge(text: string) {
  return `SQL: ${text}`;
}

export interface DockNote {
  dock: string;
  message: string;
  createdAt: string;
}

export function makeDockNote(dock: string, message: string, createdAt: Date): DockNote {
  return { dock: dock.trim(), message: message.trim(), createdAt: createdAt.toISOString() };
}

export function describeDockNote(note: DockNote) {
  return `${note.dock}: ${note.message}`;
}

export function groupNotes(notes: readonly DockNote[]) {
  return notes.reduce<Record<string, DockNote[]>>((groups, note) => {
    (groups[note.dock] ??= []).push(note);
    return groups;
  }, {});
}

export function latestNote(notes: readonly DockNote[]) {
  return notes.at(-1);
}

export const dockBoardColumns = ["dock", "carrier", "arrival"];

export function isLateLabel(label: string) {
  return label.toLowerCase().includes("late");
}

export function readFilterFromHash(hash: string) {
  return hash.replace(/^#/, "").split("=")[1] ?? "";
}

export function deliveryStatusLabel(closed: boolean) {
  return closed ? "closed" : "open";
}
