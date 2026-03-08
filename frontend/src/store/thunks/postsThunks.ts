import api from '@/services/api';
import { setError, setLoading, setPosts } from '@/store/slices/postsSlice';
import { createAsyncThunk } from '@reduxjs/toolkit';

export const fetchPosts = createAsyncThunk(
	'posts/fetchPosts',
	async (params: { page?: number; page_size?: number } = {}, { dispatch, rejectWithValue }) => {
		dispatch(setLoading(true))
		try {
			const res = await api.get('/posts/', { params })
			dispatch(setPosts(res.data.results || res.data))
			return res.data
		} catch (err: any) {
			dispatch(setError(err?.response?.data || 'Failed to fetch posts'))
			return rejectWithValue(err?.response?.data || { detail: 'Failed to fetch posts' })
		} finally {
			dispatch(setLoading(false))
		}
	}
)

export default fetchPosts
