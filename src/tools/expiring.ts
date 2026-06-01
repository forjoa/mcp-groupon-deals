export interface ExpiringArgs {
  division?: string;
  hoursAhead?: number;
  limit?: number;
}

export async function handleExpiring(_args: ExpiringArgs): Promise<unknown> {
  throw new Error("not implemented");
}
