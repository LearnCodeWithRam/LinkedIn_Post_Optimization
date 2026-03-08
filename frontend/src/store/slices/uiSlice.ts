import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
	name: 'ui',
	initialState: {
		sidebarOpen: true,
	},
	reducers: {
		setSidebarOpen(state, action) {
			state.sidebarOpen = action.payload
		},
	},
})

export const { setSidebarOpen } = uiSlice.actions
export default uiSlice.reducer
