import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import analyticsReducer from './slices/analyticsSlice'
import authReducer from './slices/authSlice'
import postsReducer from './slices/postsSlice'
import predictionsReducer from './slices/predictionsSlice'
import recommendationsReducer from './slices/recommendationsSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
	reducer: {
		auth: authReducer,
		posts: postsReducer,
		analytics: analyticsReducer,
		predictions: predictionsReducer,
		recommendations: recommendationsReducer,
		ui: uiReducer,
	},
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export default store
