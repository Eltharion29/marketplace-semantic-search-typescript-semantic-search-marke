import { searchListings, chooseHandoff } from "./marketplace_search.js";

const collection = process.env.INFRAI_COLLECTION;
if (!collection) throw new Error("INFRAI_COLLECTION must name an existing collection populated with marketplace listings embedded using text-embedding-3-small");
const matches = await searchListings({ query: "blue ceramic cup for a gift", topK: 3 }, collection);
const handoff = chooseHandoff(matches);
console.log(JSON.stringify({ matches, nextOrderHandoff: handoff?.id ?? null }, null, 2));
