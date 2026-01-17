import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api } from '../api'
import type { BeamDeflectionListItem, BeamDeflectionStatus } from '../types'

type RequestsMeta = {
  current_page?: number | null
  next_page?: number | null
  prev_page?: number | null
  total_pages?: number | null
  total_count?: number | null
}

type RequestsState = {
  items: BeamDeflectionListItem[]
  meta: RequestsMeta | null
  loading: boolean
  error: string | null
}

const initialState: RequestsState = {
  items: [],
  meta: null,
  loading: false,
  error: null,
}

type RequestsQuery =
  | {
      status?: Exclude<BeamDeflectionStatus, 'deleted'>
      from?: string
      to?: string
      page?: number
      per_page?: number
      /** When true, do not show global loading spinner (used for polling). */
      silent?: boolean
    }
  | undefined

type BeamDeflectionListRow = NonNullable<
  Awaited<ReturnType<typeof api.api.beamDeflectionsList>>['data']['beam_deflections']
>[number]

type FetchRequestsResult = {
  items: BeamDeflectionListItem[]
  meta: RequestsMeta | null
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function extractErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  return '?? ??????? ????????? ??????'
}

export const fetchBeamDeflectionsAsync = createAsyncThunk<
  FetchRequestsResult,
  RequestsQuery,
  { rejectValue: string }
>('requests/fetch', async (query, { rejectWithValue, signal }) => {
  try {
    const response = await api.api.beamDeflectionsList(
      query
        ? {
            status: query.status,
            from: query.from,
            to: query.to,
            page: query.page,
            per_page: query.per_page,
          }
        : undefined,
      { signal },
    )

    const list: BeamDeflectionListRow[] = response.data.beam_deflections ?? []
    const items = list.map((row): BeamDeflectionListItem => {
      const rawItemDeflections = (row as { item_deflections_mm?: unknown }).item_deflections_mm
      const itemDeflections = Array.isArray(rawItemDeflections)
        ? rawItemDeflections.map((value) => toNumberOrNull(value)).filter((value): value is number => value != null)
        : null
      const itemsCount = toNumberOrNull((row as { items_count?: unknown }).items_count)

      return {
        id: toNumberOrNull(row.id) ?? 0,
        status: (row.status ?? 'draft') as BeamDeflectionStatus,
        note: row.note ?? null,
        formed_at: row.formed_at ?? null,
        completed_at: row.completed_at ?? null,
        creator_login: row.creator_login ?? null,
        moderator_login: row.moderator_login ?? null,
        result_deflection_mm: toNumberOrNull(row.result_deflection_mm),
        item_deflections_mm: itemDeflections,
        items_count: itemsCount != null ? Math.round(itemsCount) : null,
      }
    })

    const meta = response.data.meta
      ? ({
          current_page: response.data.meta.current_page ?? null,
          next_page: response.data.meta.next_page ?? null,
          prev_page: response.data.meta.prev_page ?? null,
          total_pages: response.data.meta.total_pages ?? null,
          total_count: response.data.meta.total_count ?? null,
        } satisfies RequestsMeta)
      : null
    return { items, meta }
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error))
  }
})

export const completeBeamDeflectionAsync = createAsyncThunk<void, number, { rejectValue: string }>(
  'requests/complete',
  async (id, { rejectWithValue, signal }) => {
    try {
      await api.api.beamDeflectionsComplete(id, { signal })
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error))
    }
  },
)

export const rejectBeamDeflectionAsync = createAsyncThunk<void, number, { rejectValue: string }>(
  'requests/reject',
  async (id, { rejectWithValue, signal }) => {
    try {
      await api.api.beamDeflectionsReject(id, { signal })
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error))
    }
  },
)

const requestsSlice = createSlice({
  name: 'requests',
  initialState,
  reducers: {
    resetRequests: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBeamDeflectionsAsync.pending, (state, action) => {
        if (action.meta.arg?.silent) {
          state.error = null
          return
        }

        state.loading = true
        state.error = null
      })
      .addCase(fetchBeamDeflectionsAsync.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.items
        state.meta = action.payload.meta
      })
      .addCase(fetchBeamDeflectionsAsync.rejected, (state, action) => {
        if (action.meta.aborted) return

        if (!action.meta.arg?.silent) {
          state.loading = false
          state.items = []
          state.meta = null
        }

        state.error = action.payload ?? '?? ??????? ????????? ??????'
      })
      .addCase(completeBeamDeflectionAsync.fulfilled, (state, action) => {
        const id = action.meta.arg
        const item = state.items.find((row) => row.id === id)
        if (item) {
          item.status = 'completed'
          item.result_deflection_mm = null
          item.item_deflections_mm = null
        }
      })
      .addCase(rejectBeamDeflectionAsync.fulfilled, (state, action) => {
        const id = action.meta.arg
        const item = state.items.find((row) => row.id === id)
        if (item) {
          item.status = 'rejected'
        }
      })

    builder.addMatcher(
      (action) => action.type === 'auth/logout/fulfilled' || action.type === 'auth/logout/rejected',
      () => initialState,
    )
  },
})

export const { resetRequests } = requestsSlice.actions

export const selectRequests = (state: { requests: RequestsState }) => state.requests.items
export const selectRequestsMeta = (state: { requests: RequestsState }) => state.requests.meta
export const selectRequestsLoading = (state: { requests: RequestsState }) => state.requests.loading
export const selectRequestsError = (state: { requests: RequestsState }) => state.requests.error

export default requestsSlice.reducer
