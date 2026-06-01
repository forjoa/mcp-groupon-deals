export interface StatsArgs {
  division?: string;
  category?: string;
}

export async function handleStats(_args: StatsArgs): Promise<unknown> {
  throw new Error("not implemented");
}
