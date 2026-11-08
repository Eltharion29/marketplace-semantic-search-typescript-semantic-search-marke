import assert from "node:assert/strict";
import { chooseHandoff, type Listing } from "../src/marketplace_search.js";

const items: Listing[] = [
  { id: "a", title: "A", description: "", sellerId: "s", orderState: "handoff" },
  { id: "b", title: "B", description: "", sellerId: "s", orderState: "ready" }
];
assert.equal(chooseHandoff(items)?.id, "b");
console.log("handoff decision: ready listing selected");
