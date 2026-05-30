import { tool } from "ai";
import { z } from "zod";

const SEARCH_URL = "https://api.coingecko.com/api/v3/search";
const PRICE_URL = "https://api.coingecko.com/api/v3/simple/price";

type SearchResult = {
  coins?: Array<{
    id: string;
    symbol: string;
    name: string;
    market_cap_rank?: number;
  }>;
};

type PriceResult = Record<
  string,
  Record<string, number | undefined> & {
    last_updated_at?: number;
  }
>;

function authHeaders(): HeadersInit {
  const key = process.env.COINGECKO_API_KEY;
  return key ? { "x-cg-demo-api-key": key } : {};
}

async function resolveCoinId(query: string, signal: AbortSignal) {
  const url = new URL(SEARCH_URL);
  url.searchParams.set("query", query);
  const res = await fetch(url, { signal, headers: authHeaders() });
  if (!res.ok) {
    throw new Error(`CoinGecko search failed: ${res.status}`);
  }
  const data = (await res.json()) as SearchResult;
  const top = data.coins?.[0];
  return top ?? null;
}

export const getCryptoPrice = tool({
  description:
    "Get the current price, 24h change, and market cap for a cryptocurrency. Accepts symbol (BTC), name (Bitcoin, 比特币), or CoinGecko id (bitcoin). Use whenever the user asks for crypto price, market cap, or 24-hour change.",
  inputSchema: z.object({
    query: z
      .string()
      .min(1)
      .describe(
        "Crypto symbol, name, or CoinGecko id. Examples: 'BTC', 'Bitcoin', '比特币', 'ethereum'."
      ),
    vs_currency: z
      .string()
      .min(2)
      .max(8)
      .default("usd")
      .describe(
        "Quote currency code (lowercase): 'usd', 'cny', 'eur', 'jpy', etc."
      ),
  }),
  execute: async ({ query, vs_currency }) => {
    const signal = AbortSignal.timeout(8000);
    const vs = vs_currency.toLowerCase();

    const coin = await resolveCoinId(query, signal);
    if (!coin) {
      return {
        ok: false as const,
        error: `No cryptocurrency found for "${query}".`,
      };
    }

    const priceUrl = new URL(PRICE_URL);
    priceUrl.searchParams.set("ids", coin.id);
    priceUrl.searchParams.set("vs_currencies", vs);
    priceUrl.searchParams.set("include_24hr_change", "true");
    priceUrl.searchParams.set("include_market_cap", "true");
    priceUrl.searchParams.set("include_last_updated_at", "true");

    const priceRes = await fetch(priceUrl, {
      signal,
      headers: authHeaders(),
    });
    if (!priceRes.ok) {
      throw new Error(`CoinGecko price failed: ${priceRes.status}`);
    }
    const priceData = (await priceRes.json()) as PriceResult;
    const row = priceData[coin.id];
    if (!row) {
      return {
        ok: false as const,
        error: `Price unavailable for "${coin.id}" in ${vs}.`,
      };
    }

    const price = row[vs];
    const marketCap = row[`${vs}_market_cap`];
    const change24h = row[`${vs}_24h_change`];

    return {
      ok: true as const,
      coin: {
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        market_cap_rank: coin.market_cap_rank ?? null,
      },
      vs_currency: vs,
      price,
      market_cap: marketCap,
      change_24h_pct: typeof change24h === "number" ? Number(change24h.toFixed(2)) : change24h,
      last_updated_at: row.last_updated_at
        ? new Date(row.last_updated_at * 1000).toISOString()
        : null,
    };
  },
});
