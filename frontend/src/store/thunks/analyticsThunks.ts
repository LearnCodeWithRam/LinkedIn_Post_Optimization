import api from '@/services/api'
import { 
	setDashboardData, 
	setFollowerData, 
	setVisitorData, 
	setDemographics, 
	setError, 
	setLoading 
} from '@/store/slices/analyticsSlice'
import { createAsyncThunk } from '@reduxjs/toolkit'

export const fetchDashboardData = createAsyncThunk(
	'analytics/fetchDashboardData',
	async (sessionId?: string, { dispatch, rejectWithValue }) => {
		dispatch(setLoading(true))
		try {
			const params = sessionId ? { session_id: sessionId } : {}
			const res = await api.get('/analytics/dashboard/', { params })
			
			// Extract data from the response
			const data = res.data.data || res.data
			dispatch(setDashboardData(data))
			return data
		} catch (err: any) {
			dispatch(setError(err?.response?.data?.error || 'Failed to fetch dashboard'))
			return rejectWithValue(err?.response?.data || { detail: 'Failed to fetch dashboard' })
		} finally {
			dispatch(setLoading(false))
		}
	}
)

export const fetchFollowerAnalytics = createAsyncThunk(
	'analytics/fetchFollowerAnalytics',
	async ({ sessionId, days = 30 }: { sessionId?: string; days?: number }, { dispatch, rejectWithValue }) => {
		dispatch(setLoading(true))
		try {
			const params: any = { days }
			if (sessionId) params.session_id = sessionId
			
			const res = await api.get('/analytics/followers/', { params })
			const data = res.data.data || res.data
			dispatch(setFollowerData(data))
			return data
		} catch (err: any) {
			dispatch(setError(err?.response?.data?.error || 'Failed to fetch follower analytics'))
			return rejectWithValue(err?.response?.data || { detail: 'Failed to fetch follower analytics' })
		} finally {
			dispatch(setLoading(false))
		}
	}
)

export const fetchVisitorAnalytics = createAsyncThunk(
	'analytics/fetchVisitorAnalytics',
	async ({ sessionId, days = 30 }: { sessionId?: string; days?: number }, { dispatch, rejectWithValue }) => {
		dispatch(setLoading(true))
		try {
			const params: any = { days }
			if (sessionId) params.session_id = sessionId
			
			const res = await api.get('/analytics/visitors/', { params })
			const data = res.data.data || res.data
			dispatch(setVisitorData(data))
			return data
		} catch (err: any) {
			dispatch(setError(err?.response?.data?.error || 'Failed to fetch visitor analytics'))
			return rejectWithValue(err?.response?.data || { detail: 'Failed to fetch visitor analytics' })
		} finally {
			dispatch(setLoading(false))
		}
	}
)

export const fetchDemographics = createAsyncThunk(
	'analytics/fetchDemographics',
	async ({ sessionId, source = 'followers' }: { sessionId?: string; source?: 'followers' | 'visitors' }, { dispatch, rejectWithValue }) => {
		dispatch(setLoading(true))
		try {
			const params: any = { source }
			if (sessionId) params.session_id = sessionId
			
			const res = await api.get('/analytics/demographics/', { params })
			const data = res.data.data || res.data
			dispatch(setDemographics(data))
			return data
		} catch (err: any) {
			dispatch(setError(err?.response?.data?.error || 'Failed to fetch demographics'))
			return rejectWithValue(err?.response?.data || { detail: 'Failed to fetch demographics' })
		} finally {
			dispatch(setLoading(false))
		}
	}
)

export default fetchDashboardData
