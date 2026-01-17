import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import beamsReducer from './beamsSlice'
import draftReducer from './draftSlice'
import filtersReducer, { persistFilters } from './filtersSlice'
import requestsReducer from './requestsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    beams: beamsReducer,
    draft: draftReducer,
    filters: filtersReducer,
    requests: requestsReducer,
  },
  devTools: true,
})

store.subscribe(() => {
  const state = store.getState()
  persistFilters(state.filters.lastApplied)
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
