import api from '@/services/api';
import { setCredentials } from '@/store/slices/authSlice';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const login = createAsyncThunk(
	'auth/login',
	async (payload: { username: string; password: string }, { dispatch, rejectWithValue }) => {
		try {
			const res = await api.post('/auth/token/', payload)
			const token = res.data.access || res.data.token || res.data.access_token
			const refresh = res.data.refresh || res.data.refresh_token || null
			dispatch(setCredentials({ token, refreshToken: refresh, user: res.data.user || null }))
			return res.data
		} catch (err: any) {
			return rejectWithValue(err.response?.data || { detail: 'Login failed' })
		}
	}
)
