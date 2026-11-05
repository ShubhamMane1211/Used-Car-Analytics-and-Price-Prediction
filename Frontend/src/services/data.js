import { useEffect, useState } from 'react'
import { getAnalyticsCars, getFilters, errorMessage } from './api'
export function useAnalytics() {
  const [state, setState] = useState({ rows: [], total: 0, sampled: false, loading: true, error: '' })
  useEffect(() => { let active = true; Promise.all([getAnalyticsCars(), getFilters()]).then(([data, filters]) => { if (active) setState({ rows: data.rows, total: data.totalCars, sampled: data.sampled, filters, loading: false, error: '' }) }).catch(e => { if (active) setState(s => ({ ...s, loading: false, error: errorMessage(e) })) }); return () => { active = false } }, [])
  return state
}
export const carValue = (car, ...keys) => { for (const key of keys) if (car?.[key] != null) return car[key]; return '' }
export const numeric = value => { const n = Number(String(value ?? '').replace(/[^\d.-]/g, '')); return Number.isFinite(n) ? n : 0 }
export const rupees = value => value ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value) : '—'
export const compact = value => new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0)
