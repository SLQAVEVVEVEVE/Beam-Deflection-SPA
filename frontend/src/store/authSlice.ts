import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api } from '../api'
import {
  clearAuthToken,
  clearAuthUser,
  loadAuthToken,
  loadAuthUser,
  saveAuthToken,
  saveAuthUser,
  type AuthUser,
} from '../services/authStorage'
import type { User } from '../types'
import { resetFilters } from './filtersSlice'
import { resetDraft } from './draftSlice'

type AuthState = {
  token: string | null
  user: User | null
  loading: boolean
  error: string | null
}

const normalizeUser = (user: AuthUser | User | null): User | null => {
  if (!user) return null
  return { id: user.id, email: user.email, moderator: user.moderator }
}

const initialState: AuthState = {
  token: loadAuthToken(),
  user: normalizeUser(loadAuthUser()),
  loading: false,
  error: null,
}

function extractErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  return '?? ??????? ????????? ??????'
}

function extractHttpStatus(error: unknown): number | null {
  if (typeof error !== 'object' || error === null) return null
  const response = (error as { response?: unknown }).response as { status?: unknown } | undefined
  const status = response?.status
  return typeof status === 'number' ? status : null
}

export const bootstrapAuthAsync = createAsyncThunk<User | null, void, { rejectValue: string }>(
  'auth/bootstrap',
  async (_, { rejectWithValue }) => {
    const token = loadAuthToken()
    if (!token) return null

    const existingUser = loadAuthUser()

    try {
      const response = await api.api.meShow()
      const user = response.data
      if (!user?.id || !user.email) return null
      saveAuthUser({ id: user.id, email: user.email, moderator: Boolean(user.moderator) })
      return { id: user.id, email: user.email, moderator: Boolean(user.moderator) }
    } catch (error) {
      const status = extractHttpStatus(error)
      if (status === 401 || status === 403) {
        clearAuthToken()
        clearAuthUser()
        return rejectWithValue('????????? ???????????')
      }

      const fallback = normalizeUser(existingUser)
      if (fallback) return fallback

      return rejectWithValue(extractErrorMessage(error))
    }
  },
)

export const loginUserAsync = createAsyncThunk<
  { token: string; user: User },
  { email: string; password: string },
  { rejectValue: string }
>('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const response = await api.api.authSignIn({ email, password })
    const token = response.data.token
    const user = response.data.user

    if (!token || !user?.id || !user.email) return rejectWithValue('???????????? ????? ???????????')

    const normalizedUser: User = { id: user.id, email: user.email, moderator: Boolean(user.moderator) }
    saveAuthToken(token)
    saveAuthUser(normalizedUser)

    return { token, user: normalizedUser }
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error))
  }
})

export const registerUserAsync = createAsyncThunk<
  { token: string; user: User },
  { email: string; password: string; passwordConfirmation: string },
  { rejectValue: string }
>('auth/register', async ({ email, password, passwordConfirmation }, { rejectWithValue }) => {
  try {
    const response = await api.api.authSignUp({ email, password, password_confirmation: passwordConfirmation })
    const token = (response.data as { token?: string }).token
    const user = (response.data as { user?: { id?: number; email?: string; moderator?: boolean } }).user

    if (!token || !user?.id || !user.email) return rejectWithValue('???????????? ????? ???????????')

    const normalizedUser: User = { id: user.id, email: user.email, moderator: Boolean(user.moderator) }
    saveAuthToken(token)
    saveAuthUser(normalizedUser)

    return { token, user: normalizedUser }
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error))
  }
})

export const logoutUserAsync = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const token = loadAuthToken()
      if (token) {
        await api.api.authSignOut()
      }
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error))
    } finally {
      clearAuthToken()
      clearAuthUser()
      dispatch(resetDraft())
      dispatch(resetFilters())
    }
  },
)

export const updateMeAsync = createAsyncThunk<
  User,
  { email?: string; password?: string; passwordConfirmation?: string },
  { rejectValue: string }
>('auth/updateMe', async ({ email, password, passwordConfirmation }, { rejectWithValue }) => {
  try {
    const response = await api.api.meUpdate({
      email,
      password,
      password_confirmation: passwordConfirmation,
    })
    const user = response.data
    if (!user?.id || !user.email) return rejectWithValue('???????????? ????? ???????')

    const normalizedUser: User = { id: user.id, email: user.email, moderator: Boolean(user.moderator) }
    saveAuthUser(normalizedUser)
    return normalizedUser
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error))
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuthAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(bootstrapAuthAsync.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.token = loadAuthToken()
      })
      .addCase(bootstrapAuthAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? '?? ??????? ????????? ???????????'
        state.user = null
        state.token = null
      })
      .addCase(loginUserAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUserAsync.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.token
        state.user = action.payload.user
      })
      .addCase(loginUserAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? '?? ??????? ?????'
      })
      .addCase(registerUserAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUserAsync.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.token
        state.user = action.payload.user
      })
      .addCase(registerUserAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? '?? ??????? ??????????????????'
      })
      .addCase(logoutUserAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(logoutUserAsync.fulfilled, (state) => {
        state.loading = false
        state.token = null
        state.user = null
      })
      .addCase(logoutUserAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? '?? ??????? ?????'
        state.token = null
        state.user = null
      })
      .addCase(updateMeAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateMeAsync.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
      })
      .addCase(updateMeAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload ?? '?? ??????? ???????? ???????'
      })
  },
})

export const selectAuthUser = (state: { auth: AuthState }) => state.auth.user
export const selectAuthToken = (state: { auth: AuthState }) => state.auth.token
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error
export const selectIsAuthenticated = (state: { auth: AuthState }) => Boolean(state.auth.token)

export default authSlice.reducer
