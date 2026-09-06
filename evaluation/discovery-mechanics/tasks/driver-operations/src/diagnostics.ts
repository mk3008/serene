export function formatDriverLog(action: string, statement: string) {
  return `[driver] ${action}: ${statement}`;
}

export const maintenanceNote = "query receipts before export";

export function buildPreview(table: string) {
  return `select * from ${table} limit 3`;
}

export type RunStage = "loaded" | "posted" | "cleared";

export interface RunSummary {
  runId: string;
  stage: RunStage;
  itemCount: number;
}

export function summarizeRun(runId: string, stage: RunStage, itemCount: number): RunSummary {
  return { runId, stage, itemCount };
}

export function renderRunSummary(summary: RunSummary) {
  return `${summary.runId} ${summary.stage} (${summary.itemCount} items)`;
}

export function catalogHeaders() {
  return ["sku", "title", "shelf", "counted"];
}

export function normalizeShelf(value: string) {
  return value.trim().toUpperCase();
}

export function hasItems(summary: RunSummary) {
  return summary.itemCount > 0;
}

export const reconciliationPhases: readonly RunStage[] = ["loaded", "posted", "cleared"];

export function phasePosition(stage: RunStage) {
  return reconciliationPhases.indexOf(stage) + 1;
}
