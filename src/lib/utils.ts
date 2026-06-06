import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  const result = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip diacritics (é→e, ñ→n, ü→u…)
    .replace(/[^a-z0-9\s-]/g, '')      // strip anything not alphanumeric/space/dash
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')           // trim leading/trailing dashes
  // If the result is empty (e.g. name was all emojis/symbols), use a random suffix
  return result || `item-${Math.random().toString(36).slice(2, 8)}`
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price)
}
