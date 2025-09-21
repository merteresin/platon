export async function toUSD(amount: number, currency: string): Promise<number> {
  const sym = currency.toUpperCase();
  if (sym === 'USDT' || sym === 'USD') return amount;
  const map: Record<string, string> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    BNB: 'binancecoin',
    TRX: 'tron',
    MFT: 'metafi-token' // example fallback
  };
  const id = map[sym];
  if (!id) return amount; // unknown -> fallback 1:1
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`;
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    const price = data?.[id]?.usd;
    if (!price) return amount;
    return amount * Number(price);
  } catch {
    return amount;
  }
}
