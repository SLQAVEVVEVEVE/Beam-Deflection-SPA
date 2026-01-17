import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { api } from '../api'
import type { BeamDeflection, BeamDeflectionItem, BeamDeflectionStatus } from '../types'

type DraftState = {
  badgeDraftId: number | null
  badgeItemsCount: number
  current: BeamDeflection | null
  loading: boolean
  error: string | null
  addingBeamIds: number[]
  updatingItemIds: number[]
}

const initialState: DraftState = {
  badgeDraftId: null,
  badgeItemsCount: 0,
  current: null,
  loading: false,
  error: null,
  addingBeamIds: [],
  updatingItemIds: [],
}

function extractErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  return '?? ??????? ????????? ??????'
}

const normalizeStatus = (value?: string): BeamDeflectionStatus => {
  switch (value) {
    case 'draft':
    case 'formed':
    case 'completed':
    case 'rejected':
    case 'deleted':
      return value
    default:
      return 'draft'
  }
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

const normalizeItem = (raw: Partial<BeamDeflectionItem>): BeamDeflectionItem => {
  const beamId = toNumberOrNull(raw.beam_id)
  const quantity = toNumberOrNull(raw.quantity)
  return {
    beam_id: beamId ?? 0,
    beam_name: raw.beam_name,
    beam_material: raw.beam_material,
    beam_image_url: raw.beam_image_url ?? null,
    quantity: quantity != null && quantity > 0 ? Math.round(quantity) : 1,
    length_m: toNumberOrNull(raw.length_m),
    udl_kn_m: toNumberOrNull(raw.udl_kn_m),
    position: raw.position,
    deflection_mm: toNumberOrNull(raw.deflection_mm),
  }
}

type DraftApiItem = Partial<BeamDeflectionItem>

type DraftApiResponse = {
  id?: number
  status?: string
  note?: string | null
  formed_at?: string | null
  completed_at?: string | null
  creator_login?: string | null
  moderator_login?: string | null
  result_deflection_mm?: number | null
  within_norm?: boolean | null
  items?: DraftApiItem[]
}

const normalizeDraft = (raw: DraftApiResponse | null | undefined): BeamDeflection => ({
  id: toNumberOrNull(raw?.id) ?? 0,
  status: normalizeStatus(raw?.status),
  note: raw?.note ?? null,
  formed_at: raw?.formed_at ?? null,
  completed_at: raw?.completed_at ?? null,
  creator_login: raw?.creator_login ?? null,
  moderator_login: raw?.moderator_login ?? null,
  result_deflection_mm: toNumberOrNull(raw?.result_deflection_mm),
  within_norm: raw?.within_norm ?? null,
  items: Array.isArray(raw?.items) ? raw.items.map((item) => normalizeItem(item)) : [],
})

export const fetchBeamDeflectionDraftBadgeAsync = createAsyncThunk<
  { draftId: number | null; itemsCount: number },
  void,
  { rejectValue: string }
>('draft/fetchBadge', async (_, { rejectWithValue }) => {
  try {
    const response = await api.api.beamDeflectionsCartBadge()
    const rawDraftId = response.data.beam_deflection_id
    const itemsCount = response.data.items_count
    const draftId =
      typeof rawDraftId === 'number' && Number.isFinite(rawDraftId) && rawDraftId > 0 ? rawDraftId : null
    return { draftId, itemsCount: typeof itemsCount === 'number' ? itemsCount : 0 }
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error))
  }
})

export const addBeamToBeamDeflectionDraftAsync = createAsyncThunk<
  { draftId: number; itemsCount: number },
  { beamId: number; quantity?: number },
  { rejectValue: string }
>('draft/addBeam', async ({ beamId, quantity }, { rejectWithValue }) => {
  try {
    const response = await api.api.beamsAddToDraft(beamId, quantity ? { quantity } : undefined)
    const draftId = response.data.beam_deflection_id
    const itemsCount = response.data.items_count
    if (typeof draftId !== 'number') return rejectWithValue('???????????? ????? ?? ?????????')
    return { draftId, itemsCount: typeof itemsCount === 'number' ? itemsCount : 0 }
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error))
  }
})

export const loadBeamDeflectionDraftAsync = createAsyncThunk<BeamDeflection, number, { rejectValue: string }>(
  'draft/loadDraft',
  async (draftId, { rejectWithValue, signal }) => {
    try {
      const response = await api.api.beamDeflectionsShow(draftId, { signal })
      return normalizeDraft(response.data)
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error))
    }
  },
)

export const pollBeamDeflectionDraftAsync = createAsyncThunk<BeamDeflection, number, { rejectValue: string }>(
  'draft/pollDraft',
  async (draftId, { rejectWithValue, signal }) => {
    try {
      const response = await api.api.beamDeflectionsShow(draftId, { signal })
      return normalizeDraft(response.data)
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error))
    }
  },
)

export const updateBeamDeflectionDraftFieldsAsync = createAsyncThunk<
  BeamDeflection,
  { id: number; note?: string },
  { rejectValue: string }
>('draft/updateFields', async ({ id, note }, { rejectWithValue }) => {
  try {
    const response = await api.api.beamDeflectionsUpdate(id, {
      beam_deflection: {
        note,
      },
    })
    return normalizeDraft(response.data)
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error))
  }
})

export const updateBeamDeflectionDraftItemAsync = createAsyncThunk<
  void,
  { draftId: number; beamId: number; quantity?: number; length_m?: number | null; udl_kn_m?: number | null },
  { rejectValue: string }
>('draft/updateItem', async ({ draftId, beamId, quantity, length_m, udl_kn_m }, { rejectWithValue }) => {
  try {
    const beam_deflection_beam: { quantity?: number; length_m?: number | null; udl_kn_m?: number | null } = {}
    if (quantity !== undefined) beam_deflection_beam.quantity = quantity
    if (length_m !== undefined) beam_deflection_beam.length_m = length_m
    if (udl_kn_m !== undefined) beam_deflection_beam.udl_kn_m = udl_kn_m

    await api.api.beamDeflectionsUpdateItem(draftId, {
      beam_id: beamId,
      beam_deflection_beam,
    })
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error))
  }
})

export const removeBeamDeflectionDraftItemAsync = createAsyncThunk<
  void,
  { draftId: number; beamId: number },
  { rejectValue: string }
>(
  'draft/removeItem',
  async ({ draftId, beamId }, { rejectWithValue }) => {
    try {
      await api.api.beamDeflectionsRemoveItem(draftId, { beam_id: beamId })
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error))
    }
  },
)

export const deleteBeamDeflectionDraftAsync = createAsyncThunk<void, number, { rejectValue: string }>(
  'draft/delete',
  async (draftId, { rejectWithValue }) => {
    try {
      await api.api.beamDeflectionsDelete(draftId)
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error))
    }
  },
)

export const formBeamDeflectionDraftAsync = createAsyncThunk<BeamDeflection, number, { rejectValue: string }>(
  'draft/form',
  async (draftId, { rejectWithValue }) => {
    try {
      const response = await api.api.beamDeflectionsForm(draftId)
      return normalizeDraft(response.data)
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error))
    }
  },
)

const draftSlice = createSlice({
  name: 'draft',
  initialState,
  reducers: {
    resetDraft: () => initialState,
    setBadgeDraftId: (state, action: PayloadAction<number | null>) => {
      state.badgeDraftId = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBeamDeflectionDraftBadgeAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBeamDeflectionDraftBadgeAsync.fulfilled, (state, action) => {
        state.loading = false
        state.badgeDraftId = action.payload.draftId
        state.badgeItemsCount = action.payload.itemsCount
      })
      .addCase(fetchBeamDeflectionDraftBadgeAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? '?? ??????? ????????? ????? ???????'
        state.badgeDraftId = null
        state.badgeItemsCount = 0
        state.current = null
      })
      .addCase(addBeamToBeamDeflectionDraftAsync.pending, (state, action) => {
        state.error = null
        state.addingBeamIds.push(action.meta.arg.beamId)
      })
      .addCase(addBeamToBeamDeflectionDraftAsync.fulfilled, (state, action) => {
        state.addingBeamIds = state.addingBeamIds.filter((id) => id !== action.meta.arg.beamId)
        state.badgeDraftId = action.payload.draftId
        state.badgeItemsCount = action.payload.itemsCount
      })
      .addCase(addBeamToBeamDeflectionDraftAsync.rejected, (state, action) => {
        state.addingBeamIds = state.addingBeamIds.filter((id) => id !== action.meta.arg.beamId)
        state.error = action.payload ?? '?? ??????? ???????? ?????'
      })
      .addCase(loadBeamDeflectionDraftAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loadBeamDeflectionDraftAsync.fulfilled, (state, action) => {
        state.loading = false
        state.current = action.payload
      })
      .addCase(loadBeamDeflectionDraftAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? '?? ??????? ????????? ??????'
      })
      .addCase(pollBeamDeflectionDraftAsync.fulfilled, (state, action) => {
        state.current = action.payload
      })
      .addCase(pollBeamDeflectionDraftAsync.rejected, (state, action) => {
        if (action.meta.aborted) return
        if (!state.current) {
          state.error = action.payload ?? '?? ??????? ????????? ??????'
        }
      })
      .addCase(updateBeamDeflectionDraftFieldsAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateBeamDeflectionDraftFieldsAsync.fulfilled, (state, action) => {
        state.loading = false
        state.current = action.payload
      })
      .addCase(updateBeamDeflectionDraftFieldsAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? '?? ??????? ???????? ??????'
      })
      .addCase(updateBeamDeflectionDraftItemAsync.pending, (state, action) => {
        state.error = null
        state.updatingItemIds.push(action.meta.arg.beamId)
      })
      .addCase(updateBeamDeflectionDraftItemAsync.fulfilled, (state, action) => {
        state.updatingItemIds = state.updatingItemIds.filter((id) => id !== action.meta.arg.beamId)
      })
      .addCase(updateBeamDeflectionDraftItemAsync.rejected, (state, action) => {
        state.updatingItemIds = state.updatingItemIds.filter((id) => id !== action.meta.arg.beamId)
        state.error = action.payload ?? '?? ??????? ???????? ???????'
      })
      .addCase(removeBeamDeflectionDraftItemAsync.pending, (state, action) => {
        state.error = null
        state.updatingItemIds.push(action.meta.arg.beamId)
      })
      .addCase(removeBeamDeflectionDraftItemAsync.fulfilled, (state, action) => {
        state.updatingItemIds = state.updatingItemIds.filter((id) => id !== action.meta.arg.beamId)
      })
      .addCase(removeBeamDeflectionDraftItemAsync.rejected, (state, action) => {
        state.updatingItemIds = state.updatingItemIds.filter((id) => id !== action.meta.arg.beamId)
        state.error = action.payload ?? '?? ??????? ??????? ???????'
      })
      .addCase(deleteBeamDeflectionDraftAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteBeamDeflectionDraftAsync.fulfilled, (state, action) => {
        state.loading = false
        if (state.current?.id === action.meta.arg) {
          state.current = null
        }
        if (state.badgeDraftId === action.meta.arg) {
          state.badgeDraftId = null
          state.badgeItemsCount = 0
        }
      })
      .addCase(deleteBeamDeflectionDraftAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? '?? ??????? ??????? ??????'
      })
      .addCase(formBeamDeflectionDraftAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(formBeamDeflectionDraftAsync.fulfilled, (state, action) => {
        state.loading = false
        state.current = action.payload
        if (state.badgeDraftId === action.payload.id) {
          state.badgeDraftId = null
          state.badgeItemsCount = 0
        }
      })
      .addCase(formBeamDeflectionDraftAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? '?? ??????? ???????????? ??????'
      })

    builder.addMatcher(
      (action) => action.type === 'auth/logout/fulfilled' || action.type === 'auth/logout/rejected',
      () => initialState,
    )
  },
})

export const { resetDraft, setBadgeDraftId } = draftSlice.actions

export const selectBadgeDraftId = (state: { draft: DraftState }) => state.draft.badgeDraftId
export const selectBadgeItemsCount = (state: { draft: DraftState }) => state.draft.badgeItemsCount
export const selectCurrentBeamDeflection = (state: { draft: DraftState }) => state.draft.current
export const selectDraftLoading = (state: { draft: DraftState }) => state.draft.loading
export const selectDraftError = (state: { draft: DraftState }) => state.draft.error
export const selectDraftUpdatingItemIds = (state: { draft: DraftState }) => state.draft.updatingItemIds
export const selectDraftAddingBeamIds = (state: { draft: DraftState }) => state.draft.addingBeamIds
export const selectIsBeamAdding = (beamId: number) => (state: { draft: DraftState }) =>
  state.draft.addingBeamIds.includes(beamId)
export const selectIsItemUpdating = (beamId: number) => (state: { draft: DraftState }) =>
  state.draft.updatingItemIds.includes(beamId)

export const selectHasUsableDraft = (state: { draft: DraftState }) =>
  typeof state.draft.badgeDraftId === 'number' &&
  state.draft.badgeDraftId > 0 &&
  state.draft.badgeItemsCount > 0

export default draftSlice.reducer
