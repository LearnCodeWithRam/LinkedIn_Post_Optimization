import { useAppDispatch } from '@/store'
import { login } from '@/store/thunks/authThunks'
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PublicHeader from '@/components/PublicHeader'

export const Login: React.FC = () => {
	const dispatch = useAppDispatch()
	const navigate = useNavigate()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setLoading(true)

		try {
			const result = await dispatch(login({ username: email, password }) as any).unwrap()

			// Get status from backend response (more reliable than localStorage)
			const hasUploadedData = result?.has_uploaded_data || result?.data_uploaded || false
			const hasCompletedOnboarding = result?.onboarding_completed || false

			// Save user data to localStorage for dashboard display
			if (result?.user) {
				localStorage.setItem('user', JSON.stringify(result.user))
			}

			// Sync with localStorage for backward compatibility
			if (hasUploadedData) {
				localStorage.setItem('data_uploaded', 'true')
			}
			if (hasCompletedOnboarding) {
				localStorage.setItem('onboarding_completed', 'true')
			}

			// Redirect logic based on backend status
			if (!hasUploadedData) {
				// No data uploaded -> go to upload page
				navigate('/upload-data')
			} else if (!hasCompletedOnboarding) {
				// Data uploaded but onboarding not complete -> go to personal story then onboarding
				navigate('/upload-data/personal-story')
			} else {
				// Everything complete -> go to dashboard
				navigate('/')
			}
		} catch (err: any) {
			setError(err?.message || 'Invalid email or password. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex flex-col">
			<PublicHeader />

			<div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 pt-24">
				<div className="sm:mx-auto sm:w-full sm:max-w-md">
					<h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-black">
						Welcome back
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600">
						Sign in to continue creating amazing LinkedIn content
					</p>
				</div>

				<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
					<div className="bg-white py-10 px-6 shadow-2xl rounded-2xl sm:px-10 border border-gray-100">
						<form className="space-y-6" onSubmit={handleSubmit}>
							{error && (
								<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
									{error}
								</div>
							)}

							<div>
								<label htmlFor="email" className="block text-sm font-semibold text-black mb-2">
									Email address
								</label>
								<input
									id="email"
									name="email"
									type="email"
									autoComplete="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="block w-full appearance-none rounded-xl border border-gray-300 px-4 py-3 placeholder-gray-400 shadow-sm focus:border-[#0d569e] focus:outline-none focus:ring-2 focus:ring-[#0d569e] transition-all duration-200"
									placeholder="your@email.com"
								/>
							</div>

							<div>
								<label htmlFor="password" className="block text-sm font-semibold text-black mb-2">
									Password
								</label>
								<input
									id="password"
									name="password"
									type="password"
									autoComplete="current-password"
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="block w-full appearance-none rounded-xl border border-gray-300 px-4 py-3 placeholder-gray-400 shadow-sm focus:border-[#0d569e] focus:outline-none focus:ring-2 focus:ring-[#0d569e] transition-all duration-200"
									placeholder="••••••••"
								/>
							</div>

							<div className="flex items-center justify-between">
								<div className="flex items-center">
									<input
										id="remember-me"
										name="remember-me"
										type="checkbox"
										className="h-4 w-4 rounded border-gray-300 text-[#0d569e] focus:ring-[#0d569e]"
									/>
									<label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
										Remember me
									</label>
								</div>

								{/* <div className="text-sm">
									<Link to="/auth/forgot-password" className="font-medium text-[#0d569e] hover:text-[#0a4278] transition-colors">
										Forgot password?
									</Link>
								</div> */}
							</div>

							<button
								type="submit"
								disabled={loading}
								className="flex w-full justify-center rounded-xl bg-[#ff6700] px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-[#e55d00] focus:outline-none focus:ring-2 focus:ring-[#ff6700] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
							>
								{loading ? (
									<>
										<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Signing in...
									</>
								) : (
									'Sign in'
								)}
							</button>

							{/* <div className="relative my-6">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t border-gray-300"></div>
								</div>
								<div className="relative flex justify-center text-sm">
									<span className="bg-white px-4 text-gray-500 font-medium">Or continue with</span>
								</div>
							</div> */}

							{/* <button
								type="button"
								onClick={async () => {
									const apiUrl = (import.meta as any).env?.VITE_API_URL || '/api';
									const response = await fetch(`${apiUrl}/v1/accounts/linkedin/signin/`);
									const data = await response.json();
									if (data.auth_url) window.location.href = data.auth_url;
								}}
								className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#0A66C2] px-4 py-3 text-sm font-bold text-white hover:bg-[#004182] transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
							>
								<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
									<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
								</svg>
								Sign in with LinkedIn
							</button> */}

							{/* <div className="relative my-6">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t border-gray-300"></div>
								</div>
								<div className="relative flex justify-center text-sm">
									<span className="bg-white px-4 text-gray-500 font-medium">Or continue with</span>
								</div>
							</div> */}


							{/* <button
								type="button"
								onClick={async () => {
									const apiUrl = (import.meta as any).env?.VITE_API_URL || '/api';
									const response = await fetch(`${apiUrl}/v1/accounts/google/signin/`);
									const data = await response.json();
									if (data.auth_url) window.location.href = data.auth_url;
								}}
								className="flex w-full items-center justify-center gap-3 rounded-xl bg-white border border-gray-300 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm"
							>
								<svg className="h-5 w-5" viewBox="0 0 24 24">
									<path
										d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
										fill="#4285F4"
									/>
									<path
										d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
										fill="#34A853"
									/>
									<path
										d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
										fill="#FBBC05"
									/>
									<path
										d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
										fill="#EA4335"
									/>
								</svg>
								Sign in with Google
							</button> */}


						</form>
						<p className="mt-8 text-center text-sm text-gray-600">
							Don't have an account?{' '}
							<Link to="/register" className="font-semibold text-[#0d569e] hover:text-[#0a4278] transition-colors">
								Sign up for free
							</Link>
						</p>
					</div>
				</div>

				{/* Footer */}
				<div className="mt-8 text-center">
					<p className="text-xs text-gray-500">
						© 2024 FeedInsight. Create. Schedule. Grow.
					</p>
				</div>
			</div>
		</div>
	)
}
