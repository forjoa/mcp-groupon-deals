export interface BestValueArgs {
  division?: string;
  category?: string;
  limit?: number;
}

export async function handleBestValue(_args: BestValueArgs): Promise<unknown> {
  throw new Error("not implemented");
}
