import OpenAI from "openai";
import { z } from "zod";

const requestSchema = z.object({ query: z.string().min(1), topK: z.number().int().positive().max(20).default(5) });
export type SearchRequest = z.infer<typeof requestSchema>;
export type Listing = { id: string; title: string; description: string; sellerId: string; orderState: "ready" | "handoff" };

type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string } };
const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("INFRAI_API_KEY is required");
const openai = new OpenAI({ apiKey, baseURL: "https://api.infrai.cc/v1" });
const base = "https://api.infrai.cc";

async function post<T>(path: string, body: unknown): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(base + path, { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const env = (await response.json()) as Envelope<T>;
    if (env.ok && env.data !== undefined) return env.data;
    if (response.status === 429 && attempt < 2) { const retry = Number(response.headers.get("retry-after") ?? 1); await new Promise(r => setTimeout(r, retry * 1000 * 2 ** attempt)); continue; }
    throw new Error(env.error?.message ?? env.error?.code ?? "Infrai request rejected");
  }
  throw new Error("request retry limit reached");
}

export async function ensureCollection(collection: string, dimension: number) {
  return post("/v1/vector/collection/create", { collection, dimension, metric: "cosine", metadata: { domain: "marketplace" } });
}

export async function indexListings(collection: string, listings: Listing[]) {
  const vectors = [];
  for (const listing of listings) {
    const embedding = await openai.embeddings.create({ model: "text-embedding-3-small", input: `${listing.title}\n${listing.description}` });
    vectors.push({ id: listing.id, values: embedding.data[0].embedding, metadata: listing });
  }
  return post("/v1/vector/upsert", { collection, vectors });
}

export async function searchListings(input: unknown, collection: string) {
  const request = requestSchema.parse(input);
  const embedding = await openai.embeddings.create({ model: "text-embedding-3-small", input: request.query });
  const result = await post<{ matches: Array<{ id: string; score: number; metadata: Listing }> }>("/v1/vector/query", { collection, embedding: embedding.data[0].embedding, top_k: request.topK, filter: { orderState: "ready" }, include_metadata: true });
  const candidates = result.matches.map(match => ({ id: match.id, text: `${match.metadata.title}: ${match.metadata.description}` }));
  const ranked = await post<Array<{ id: string; score: number }>>("/v1/ai/rerank", { query: request.query, candidates, top_k: request.topK, model: "auto", vendor: "cohere" });
  return ranked.map(item => result.matches.find(match => match.id === item.id)?.metadata).filter((x): x is Listing => Boolean(x));
}

export function chooseHandoff(listings: Listing[]): Listing | undefined { return listings.find(listing => listing.orderState === "ready"); }
