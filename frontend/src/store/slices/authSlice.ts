import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface AuthState {
	token: string | null
	refreshToken: string | null
	user: any | null
	isAuthenticated: boolean
}

const initialState: AuthState = {
	token: typeof window !== 'undefined' ? localStorage.getItem('authToken') : null,
	refreshToken: typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null,
	user: null,
	isAuthenticated: !!(typeof window !== 'undefined' && localStorage.getItem('authToken')),
}

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		setCredentials(
			state,
			action: PayloadAction<{ token: string; refreshToken?: string; user?: any }>
		) {
			state.token = action.payload.token
			state.refreshToken = action.payload.refreshToken || state.refreshToken
			state.user = action.payload.user || null
			state.isAuthenticated = true
			try {
				localStorage.setItem('authToken', action.payload.token)
				if (action.payload.refreshToken) {
					localStorage.setItem('refreshToken', action.payload.refreshToken)
				}
				if (action.payload.user) {
					localStorage.setItem('user', JSON.stringify(action.payload.user))
				}
			} catch (e) {
				// ignore
			}
		},
		setRefreshToken(state, action: PayloadAction<string | null>) {
			state.refreshToken = action.payload
			try {
				if (action.payload) localStorage.setItem('refreshToken', action.payload)
				else localStorage.removeItem('refreshToken')
			} catch (e) { }
		},
		logout(state) {
			state.token = null
			state.refreshToken = null
			state.user = null
			state.isAuthenticated = false
			try {
				localStorage.removeItem('authToken')
				localStorage.removeItem('refreshToken')
				localStorage.removeItem('user')
			} catch (e) {
				// ignore
			}
		},
	},
})

export const { setCredentials, setRefreshToken, logout } = authSlice.actions

export default authSlice.reducer
