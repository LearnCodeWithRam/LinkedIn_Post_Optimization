import { createSlice } from '@reduxjs/toolkit'

const postsSlice = createSlice({
	name: 'posts',
	initialState: {
		items: [] as any[],
		loading: false,
		error: null as string | null,
	},
	reducers: {
		setPosts(state, action) {
			state.items = action.payload
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

export const { setPosts, setLoading, setError } = postsSlice.actions
export default postsSlice.reducer
