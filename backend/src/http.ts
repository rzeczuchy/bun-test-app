export const json = (data: unknown, status = 200) => Response.json(data, { status });

export const error = (message: string, status: number) => json({ error: message }, status);

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
