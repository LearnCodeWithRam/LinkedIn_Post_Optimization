import { createSlice } from '@reduxjs/toolkit'

interface AnalyticsState {
	dashboardData: any | null;
	followerData: any | null;
	visitorData: any | null;
	demographics: any | null;
	loading: boolean;
	error: string | null;
}

const analyticsSlice = createSlice({
	name: 'analytics',
	initialState: {
		dashboardData: null,
		followerData: null,
		visitorData: null,
		demographics: null,
		loading: false,
		error: null,
	} as AnalyticsState,
	reducers: {
		setDashboardData(state, action) {
			state.dashboardData = action.payload
			state.loading = false
			state.error = null
		},
		setFollowerData(state, action) {
			state.followerData = action.payload
			state.loading = false
			state.error = null
		},
		setVisitorData(state, action) {
			state.visitorData = action.payload
			state.loading = false
			state.error = null
		},
		setDemographics(state, action) {
			state.demographics = action.payload
			state.loading = false
			state.error = null
		},
		setLoading(state, action) {
			state.loading = action.payload
		},
		setError(state, action) {
			state.error = action.payload
			state.loading = false
		},
	},
})

export const { 
	setDashboardData, 
	setFollowerData, 
	setVisitorData, 
	setDemographics, 
	setLoading, 
	setError 
} = analyticsSlice.actions
export default analyticsSlice.reducer
