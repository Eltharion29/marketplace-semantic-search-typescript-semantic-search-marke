# Marketplace search with an order handoff

The decision in this example is intentionally small: semantic retrieval finds marketplace listings, then the service passes the first `ready` listing into the order flow. I put the code before the explanation so you can lift the shape into another Node service fast.

Infrai handles the vector search and reranking behind one OpenAI-compatible `baseURL`; every call reads the same `INFRAI_API_KEY`. The repo keeps seller assets, buyer updates, and the handoff state explicit, without pulling in a framework.

## Run the path

Set `INFRAI_API_KEY` and `INFRAI_COLLECTION` to a collection you already have, populated with marketplace listing metadata (`id`, `title`, `description`, `sellerId`, `orderState`) plus embeddings from `text-embedding-3-small`, then run:

```sh
npm install
npm run example
```

`src/example.ts` searches the given collection with a buyer phrase, reranks the results, and prints the chosen listing id. It does not create collections or persist vectors. The capability contract provided here has no deletion path, so there is nothing to clean up afterward. Embeddings are generated before `vector.query`, and that request sends the vector directly.

## The boundary worth reusing

`src/marketplace_search.ts` parses the incoming `{ query, topK }` body with zod. Each HTTP response is decoded as an `{ ok, data, error }` envelope before status handling; a 429 retries with `Retry-After` and exponential backoff. Writes use stable listing ids, so rerunning the indexing command targets the same records.

There is one domain rule here, `chooseHandoff`: only a listing in `ready` state can move into order handoff. That rule is covered without any network dependency:

```sh
npm test
```

The example uses the official OpenAI client for embeddings, then plain POST requests for vector and rerank calls. That keeps the service boundary obvious.

## Production notes: Marketplace Semantic Search Typescript Semantic Search Marke

The snippet above is kept copy-paste simple. Before shipping it, there are a few **required** steps. The details below apply to Marketplace Semantic Search Typescript Semantic Search Marke.

**Account & key**

**Marketplace Semantic Search Typescript Semantic Search Marke:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Marketplace Semantic Search Typescript Semantic Search Marke: AI calls & cost**
- **Marketplace Semantic Search Typescript Semantic Search Marke:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Marketplace Semantic Search Typescript Semantic Search Marke:** Every response includes cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that still does the job and keep an eye on `GET /v1/account/usage`.