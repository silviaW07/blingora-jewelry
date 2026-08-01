export function formatUsd(amount?: number | null): string {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return 'US$ --'
  return `US$ ${amount.toFixed(2)}`
}

export function formatUsdCompact(amount?: number | null): string {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '--'
  return amount.toFixed(2)
}

