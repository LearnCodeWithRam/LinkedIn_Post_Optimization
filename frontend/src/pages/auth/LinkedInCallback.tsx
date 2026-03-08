import { useAppDispatch } from '@/store'
import { setCredentials } from '@/store/slices/authSlice'
import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export const LinkedInCallback: React.FC = () => {
	const loc = useLocation()
	const navigate = useNavigate()
	const dispatch = useAppDispatch()
	const [error, setError] = useState<string | null>(null)
	const hasProcessed = useRef(false);

	useEffect(() => {
		const params = new URLSearchParams(loc.search)
		const code = params.get('code')
		const state = params.get('state')
		const errorParam = params.get('error')
		if (hasProcessed.current) return;
		hasProcessed.current = true;

		// Handle OAuth errors
		if (errorParam) {
			setError(`LinkedIn authorization failed: ${errorParam}`)
			setTimeout(() => navigate('/login'), 3000)
			return
		}

		// Validate required parameters
		if (!code || !state) {
			setError('Missing authorization code or state parameter')
			setTimeout(() => navigate('/login'), 3000)
			return
		}

		// Process LinkedIn callback
		; (async () => {
			try {
				const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'
				const url = `${apiUrl}/api/v1/accounts/linkedin/signin/callback/?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`

				const response = await fetch(url)

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}))
					throw new Error(errorData.error || `Callback failed: ${response.statusText}`)
				}

				const data = await response.json()

				// Store tokens and user data
				if (data.tokens) {
					localStorage.setItem('authToken', data.tokens.access)
					localStorage.setItem('refreshToken', data.tokens.refresh)

					// Store user data for profile display
					if (data.user) {
						localStorage.setItem('user', JSON.stringify(data.user))
					}

					// Update Redux state
					dispatch(setCredentials({
						token: data.tokens.access,
						refreshToken: data.tokens.refresh,
						user: data.user || null
					}))
				}

				// Route based on onboarding status
				if (!data.onboarding_completed) {
					// New user or incomplete onboarding -> go to upload data
					navigate('/upload-data')
				} else if (!data.data_uploaded) {
					// Onboarding complete but no data -> go to upload data
					navigate('/upload-data')
				} else {
					// Everything complete -> go to dashboard
					navigate('/dashboard')
				}
			} catch (err: any) {
				console.error('LinkedIn callback error:', err)
				setError(err.message || 'Failed to complete LinkedIn sign-in')
				setTimeout(() => navigate('/login'), 3000)
			}
		})()
	}, [loc.search, dispatch, navigate])

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center">
			<div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
				{error ? (
					<>
						<div className="mb-4">
							<svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<h2 className="text-xl font-bold text-gray-900 mb-2">Sign-in Failed</h2>
						<p className="text-gray-600 mb-4">{error}</p>
						<p className="text-sm text-gray-500">Redirecting to login...</p>
					</>
				) : (
					<>
						<div className="mb-4">
							<svg className="animate-spin mx-auto h-12 w-12 text-[#0A66C2]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
						</div>
						<h2 className="text-xl font-bold text-gray-900 mb-2">Completing Sign-in</h2>
						<p className="text-gray-600">Processing your LinkedIn credentials...</p>
					</>
				)}
			</div>
		</div>
	)
}
