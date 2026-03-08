import { createSlice } from '@reduxjs/toolkit'

const recommendationsSlice = createSlice({
	name: 'recommendations',
	initialState: {
		items: [] as any[],
		loading: false,
	},
	reducers: {
		setRecommendations(state, action) {
			state.items = action.payload
			state.loading = false
		},
		setLoading(state, action) {
			state.loading = action.payload
		},
	},
})

export const { setRecommendations, setLoading } = recommendationsSlice.actions
export default recommendationsSlice.reducer
