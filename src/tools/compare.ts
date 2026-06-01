export interface CompareArgs {
  dealIdA: string;
  dealIdB: string;
}

export async function handleCompare(_args: CompareArgs): Promise<unknown> {
  throw new Error("not implemented");
}
