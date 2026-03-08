import Layout from '@/components/layout/Layout'
import { NewDashboard } from '@/pages/Dashboard/header'
import { LinkedInCallback } from '@/pages/auth/LinkedInCallback'
import { GoogleCallback } from '@/pages/auth/GoogleCallback'
import { Login } from '@/pages/auth/Login'
import { Register } from '@/pages/auth/Register'
import { OnboardingFlow } from '@/pages/onboarding/OnboardingFlow'
import PostsList from '@/pages/posts/PostsList'
import { ProfilePage } from '@/pages/Profile/ProfilePage'
import { UploadData } from '@/pages/upload_data/upload_data'
import { PersonalStory } from '@/pages/upload_data/PersonalStory'
import Home from '@/pages/home_page/Home'
import PrivateRoute from '@/routes/PrivateRoute'
import PublicRoute from '@/routes/PublicRoute'
import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAppSelector } from '@/store'

// Root route logic
const RootRoute: React.FC = () => {
	const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
	return isAuthenticated ? <NewDashboard /> : <Home />
}

const App: React.FC = () => {
	return (
		<Suspense fallback={<div className="p-8">Loading...</div>}>
			<Routes>

				{/* Root route - Home if not logged in, Dashboard if logged in */}
				<Route path="/" element={<RootRoute />} />

				{/* Public Auth Routes */}
				<Route element={<PublicRoute />}>
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
					<Route path="/auth/linkedin/callback" element={<LinkedInCallback />} />
					<Route path="/auth/linkedin/signin/callback" element={<LinkedInCallback />} />
					<Route path="/auth/google/signin/callback" element={<GoogleCallback />} />
				</Route>

				{/* Private Routes */}
				<Route element={<PrivateRoute />}>

					{/* Dashboard */}
					<Route path="/dashboard" element={<Layout />}>
						<Route index element={<NewDashboard />} />
						<Route path="posts" element={<PostsList />} />
					</Route>

					{/* Direct posts route */}
					<Route path="/posts" element={<Layout />}>
						<Route index element={<PostsList />} />
					</Route>

					{/* Upload Data */}
					<Route path="/upload-data" element={<UploadData />} />
					<Route path="/upload-data/personal-story" element={<PersonalStory />} />

					{/* Onboarding */}
					<Route path="/onboarding" element={<OnboardingFlow />} />

					{/* Profile */}
					<Route path="/profile" element={<ProfilePage />} />

				</Route>

				{/* Catch all */}
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</Suspense>
	)
}

export default App
