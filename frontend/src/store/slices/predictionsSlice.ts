import { createSlice } from '@reduxjs/toolkit'

const predictionsSlice = createSlice({
	name: 'predictions',
	initialState: {
		items: [] as any[],
		loading: false,
	},
	reducers: {
		setPredictions(state, action) {
			state.items = action.payload
			state.loading = false
		},
		setLoading(state, action) {
			state.loading = action.payload
		},
	},
})

export const { setPredictions, setLoading } = predictionsSlice.actions
export default predictionsSlice.reducer
