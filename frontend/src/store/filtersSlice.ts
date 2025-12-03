import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { BeamFilters } from '../types'

const STORAGE_KEY = 'beam.filters'
const DEFAULT_FILTERS: BeamFilters = { perPage: 12, page: 1 }

const normalizeFilters = (value?: BeamFilters): BeamFilters => {
  const merged: BeamFilters = { ...DEFAULT_FILTERS, ...(value || {}) }
  if (!merged.page) merged.page = 1
  if (!merged.perPage) merged.perPage = DEFAULT_FILTERS.perPage
  return merged
}

const loadFromStorage = (): BeamFilters | null => {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as BeamFilters
    return normalizeFilters(parsed)
  } catch {
    return null
  }
}

export const persistFilters = (filters: BeamFilters) => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
  } catch {
    // ignore storage failures (private mode, quota issues)
  }
}

const initialFilters = normalizeFilters(loadFromStorage() || undefined)

type FiltersState = {
  current: BeamFilters
  lastApplied: BeamFilters
}

const initialState: FiltersState = {
  current: initialFilters,
  lastApplied: initialFilters,
}

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<BeamFilters>>) => {
      state.current = normalizeFilters({ ...state.current, ...action.payload })
    },
    applyFilters: (state, action: PayloadAction<BeamFilters | undefined>) => {
      const nextFilters = normalizeFilters(action.payload ?? state.current)
      state.current = nextFilters
      state.lastApplied = nextFilters
    },
    resetFilters: (state) => {
      state.current = DEFAULT_FILTERS
      state.lastApplied = DEFAULT_FILTERS
    },
  },
})

export const { setFilters, applyFilters, resetFilters } = filtersSlice.actions

export const selectCurrentFilters = (state: { filters: FiltersState }) => state.filters.current
export const selectAppliedFilters = (state: { filters: FiltersState }) => state.filters.lastApplied

export default filtersSlice.reducer
