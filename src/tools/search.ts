export interface SearchArgs {
  query: string;
  division?: string;
  page?: number;
  limit?: number;
}

export async function handleSearch(_args: SearchArgs): Promise<unknown> {
  throw new Error("not implemented");
}
