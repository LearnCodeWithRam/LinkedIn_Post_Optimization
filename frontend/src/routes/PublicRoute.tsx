import { useAppSelector } from '@/store'
import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'

const PublicRoute: React.FC = () => {
	const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
	// If already authenticated, redirect to dashboard
	if (isAuthenticated) return <Navigate to="/" replace />
	return <Outlet />
}

export default PublicRoute
