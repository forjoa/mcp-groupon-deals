const TTL_MS = 20 * 60 * 1000; // 20 minutes

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36";

let cachedCookies: string | null = null;
let cacheExpiresAt = 0;
let inflightHarvest: Promise<string> | null = null;

async function harvestCookies(division: string): Promise<string> {
  // Dynamic import keeps Playwright out of the critical startup path.
  const { chromium } = await import("playwright");

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ userAgent: USER_AGENT });

    // Pre-set the division cookie so Groupon serves the right locale.
    await context.addCookies([
      {
        name: "division",
        value: division,
        domain: ".groupon.es",
        path: "/",
      },
      {
        name: "user_locale",
        value: "es_ES",
        domain: ".groupon.es",
        path: "/",
      },
    ]);

    const page = await context.newPage();

    // domcontentloaded is enough to trigger Cloudflare's challenge cookies.
    // networkidle times out because Cloudflare keeps SSE connections open.
    await page.goto("https://www.groupon.es/", { waitUntil: "domcontentloaded", timeout: 15000 });
    // Wait for __cf_bm specifically; fall through gracefully if Cloudflare never sets it.
    await page.waitForFunction(
      () => document.cookie.includes("__cf_bm"),
      { timeout: 10000 }
    ).catch(() => undefined);

    const cookies = await context.cookies("https://www.groupon.es");
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

    cachedCookies = cookieHeader;
    cacheExpiresAt = Date.now() + TTL_MS;

    return cookieHeader;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to obtain Groupon session cookies: ${message}`);
  } finally {
    await browser.close();
  }
}

/**
 * Returns a ready-to-use `Cookie: …` header string for groupon.es.
 *
 * On the first call (or after the 20-minute TTL expires) it launches a
 * headless Chromium, visits groupon.es, and harvests whatever cookies
 * Cloudflare and Groupon set.  Subsequent calls within the TTL window are
 * instant (in-memory cache).
 */
export async function getCookieHeader(division: string): Promise<string> {
  if (cachedCookies !== null && Date.now() < cacheExpiresAt) {
    return cachedCookies;
  }
  if (inflightHarvest) return inflightHarvest;
  inflightHarvest = harvestCookies(division).finally(() => {
    inflightHarvest = null;
  });
  return inflightHarvest;
}
