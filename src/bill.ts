export type TipChoice = { label: string; pct: number }
export type Bill = { subtotal: number; tip: number; service: number; total: number }
export type Money = { full: (n: number) => string; short: (n: number) => string }

export const SUBTOTAL = 12.4
export const TIPS = [0.05, 0.1, 0.15]

export const round2 = (n: number) => Math.round(n * 100) / 100

export function tipChoices(tips: number[]): TipChoice[] {
  return [
    { label: 'None', pct: 0 },
    ...tips.map((pct) => ({ label: `${Math.round(pct * 100)}%`, pct })),
  ]
}

export function money(currency = 'GBP', locale = 'en-GB'): Money {
  const full = new Intl.NumberFormat(locale, { style: 'currency', currency })
  const whole = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  return {
    full: (n) => full.format(n),
    short: (n) => {
      if (n === 0) return whole.format(0)
      if (currency === 'GBP' && n < 1) return `${Math.round(n * 100)}p`
      return full.format(n)
    },
  }
}
