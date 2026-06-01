import { z } from "zod";
import { DIVISIONS } from "../groupon/divisions.js";

export const DivisionSchema = z
  .enum(DIVISIONS as unknown as [string, ...string[]])
  .describe("Spanish city division (e.g. 'madrid', 'barcelona')");

export function formatPrice(euros: number): string {
  return euros.toFixed(2);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function hoursUntil(iso: string): number {
  return Math.round((new Date(iso).getTime() - Date.now()) / 3_600_000);
}
