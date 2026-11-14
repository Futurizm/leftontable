export const usd = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: digits, minimumFractionDigits: digits });

export const pct = (n: number, digits = 1) => `${(n * 100).toFixed(digits).replace(/\.0+$/, "")}%`;

export const round = (n: number) => Math.round(n);
