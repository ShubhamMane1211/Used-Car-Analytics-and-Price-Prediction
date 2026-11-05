import axios from 'axios'
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000', timeout: 15000 })
export const getFilters = async () => (await api.get('/api/cars/filters')).data.filters
export const getCars = async (params = {}) => (await api.get('/api/cars', { params })).data
export const getAnalyticsCars = async () => {
  const first = await getCars({ page: 1, limit: 100, sortBy: 'Year', sortOrder: 'desc' })
  let rows = first.data || []
  const pages = Math.min(first.totalPages || 1, 10)
  for (let page = 2; page <= pages; page++) {
    const result = await getCars({ page, limit: 100, sortBy: 'Year', sortOrder: 'desc' })
    rows = rows.concat(result.data || [])
  }
  return { rows, totalCars: first.totalCars || rows.length, sampled: rows.length < (first.totalCars || 0) }
}
export const predictPrice = async (payload) => (await api.post('/api/predict', payload)).data
export const errorMessage = (error) => error.response?.data?.message || error.response?.data?.detail || error.message || 'Something went wrong.'
