import { configureStore } from '@reduxjs/toolkit'
import filtersReducer, { persistFilters } from './filtersSlice'

export const store = configureStore({
  reducer: {
    filters: filtersReducer,
  },
  devTools: true,
})

store.subscribe(() => {
  const state = store.getState()
  persistFilters(state.filters.lastApplied)
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
