import { useAppSelector } from '@/store'
import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'

const PrivateRoute: React.FC = () => {
	const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
	if (!isAuthenticated) {
		return <Navigate to="/auth/login" replace />
	}
	return <Outlet />
}

export default PrivateRoute
