import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api } from '../api'
import { mockBeams } from '../data/mockBeams'
import type { Beam, BeamFilters } from '../types'

type BeamsState = {
  items: Beam[]
  loading: boolean
  error: string | null
  source: 'api' | 'mock'
}

const initialState: BeamsState = {
  items: [],
  loading: false,
  error: null,
  source: 'api',
}

const filterMock = (filters: BeamFilters): Beam[] => {
  const name = filters.name?.trim().toLowerCase()
  if (!name) return mockBeams
  return mockBeams.filter((beam) => beam.name.toLowerCase().includes(name))
}

export const fetchBeamsAsync = createAsyncThunk<
  { beams: Beam[]; source: 'api' | 'mock' },
  BeamFilters,
  { rejectValue: string }
>('beams/fetch', async (filters) => {
  try {
    const response = await api.api.beamsList({
      q: filters.name,
      page: filters.page,
      per_page: filters.perPage,
    })
    const beams = (response.data.beams ?? []).filter(Boolean) as Beam[]
    return { beams, source: 'api' }
  } catch (error) {
    console.warn('Falling back to mock beams', error)
    const beams = filterMock(filters)
    return { beams, source: 'mock' }
  }
})

const beamsSlice = createSlice({
  name: 'beams',
  initialState,
  reducers: {
    clearBeams: (state) => {
      state.items = []
      state.error = null
      state.source = 'api'
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBeamsAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBeamsAsync.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.beams
        state.source = action.payload.source
      })
      .addCase(fetchBeamsAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? '?? ??????? ????????? ?????'
        state.items = []
      })

    builder.addMatcher(
      (action) => action.type === 'auth/logout/fulfilled' || action.type === 'auth/logout/rejected',
      (state) => {
        state.items = []
        state.error = null
        state.source = 'api'
      },
    )
  },
})

export const { clearBeams } = beamsSlice.actions

export const selectBeams = (state: { beams: BeamsState }) => state.beams.items
export const selectBeamsLoading = (state: { beams: BeamsState }) => state.beams.loading
export const selectBeamsError = (state: { beams: BeamsState }) => state.beams.error
export const selectBeamsSource = (state: { beams: BeamsState }) => state.beams.source

export default beamsSlice.reducer
