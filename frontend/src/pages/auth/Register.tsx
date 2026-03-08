import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '@/services/api'
import PublicHeader from '@/components/PublicHeader'

export const Register: React.FC = () => {
	const navigate = useNavigate()
	const [formData, setFormData] = useState({
		email: '',
		password: '',
		confirmPassword: '',
		firstName: '',
		lastName: '',
		otp: '',
	})
	const [loading, setLoading] = useState(false)
	const [otpSending, setOtpSending] = useState(false)
	const [otpSent, setOtpSent] = useState(false)
	const [error, setError] = useState('')
	const [successMessage, setSuccessMessage] = useState('')

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		})
	}

	const handleSendOTP = async () => {
		if (!formData.email) {
			setError('Please enter your email address first')
			return
		}

		setOtpSending(true)
		setError('')
		setSuccessMessage('')

		try {
			await api.post('/accounts/send-otp/', { email: formData.email })
			setOtpSent(true)
			setSuccessMessage('OTP sent successfully to ' + formData.email)
		} catch (err: any) {
			setError(err?.response?.data?.error || 'Failed to send OTP. Please try again.')
		} finally {
			setOtpSending(false)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')

		// Validate passwords match
		if (formData.password !== formData.confirmPassword) {
			setError('Passwords do not match')
			return
		}

		// Validate password length
		if (formData.password.length < 8) {
			setError('Password must be at least 8 characters long')
			return
		}

		if (!otpSent) {
			setError('Please verify your email with OTP first')
			return
		}

		if (!formData.otp) {
			setError('Please enter the OTP sent to your email')
			return
		}

		setLoading(true)

		try {
			await api.post('/accounts/register/', {
				email: formData.email,
				password: formData.password,
				first_name: formData.firstName,
				last_name: formData.lastName,
				otp: formData.otp,
			})

			// Show success message and redirect
			// We use the existing successMessage state but clear the form or show an alert via UI
			alert('Registration successfully done! Redirecting to login...')
			navigate('/login')

		} catch (err: any) {
			const errorMessage = err?.response?.data?.detail ||
				err?.response?.data?.otp?.[0] ||
				err?.response?.data?.email?.[0] ||
				err?.response?.data?.password?.[0] ||
				'Registration failed. Please try again.'
			setError(errorMessage)
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
						Create your account
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600">
						Start creating amazing LinkedIn content today
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

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label htmlFor="firstName" className="block text-sm font-semibold text-black mb-2">
										First Name
									</label>
									<input
										id="firstName"
										name="firstName"
										type="text"
										required
										value={formData.firstName}
										onChange={handleChange}
										className="block w-full appearance-none rounded-xl border border-gray-300 px-4 py-3 placeholder-gray-400 shadow-sm focus:border-[#0d569e] focus:outline-none focus:ring-2 focus:ring-[#0d569e] transition-all duration-200"
										placeholder="John"
									/>
								</div>

								<div>
									<label htmlFor="lastName" className="block text-sm font-semibold text-black mb-2">
										Last Name
									</label>
									<input
										id="lastName"
										name="lastName"
										type="text"
										required
										value={formData.lastName}
										onChange={handleChange}
										className="block w-full appearance-none rounded-xl border border-gray-300 px-4 py-3 placeholder-gray-400 shadow-sm focus:border-[#0d569e] focus:outline-none focus:ring-2 focus:ring-[#0d569e] transition-all duration-200"
										placeholder="Doe"
									/>
								</div>
							</div>

							<div>
								<label htmlFor="email" className="block text-sm font-semibold text-black mb-2">
									Email Address
								</label>
								<div className="flex gap-2">
									<input
										id="email"
										name="email"
										type="email"
										autoComplete="email"
										required
										value={formData.email}
										onChange={handleChange}
										disabled={otpSent}
										className="block w-full appearance-none rounded-xl border border-gray-300 px-4 py-3 placeholder-gray-400 shadow-sm focus:border-[#0d569e] focus:outline-none focus:ring-2 focus:ring-[#0d569e] transition-all duration-200"
										placeholder="your@email.com"
									/>
									<button
										type="button"
										onClick={handleSendOTP}
										disabled={otpSending || otpSent || !formData.email}
										className="whitespace-nowrap rounded-xl bg-[#0d569e] px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#0a4278] focus:outline-none focus:ring-2 focus:ring-[#0d569e] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
									>
										{otpSending ? 'Sending...' : otpSent ? 'Sent' : 'Send OTP'}
									</button>
								</div>
								{successMessage && (
									<p className="mt-2 text-sm text-green-600">{successMessage}</p>
								)}
							</div>

							<div>
								<label htmlFor="password" className="block text-sm font-semibold text-black mb-2">
									Password
								</label>
								<input
									id="password"
									name="password"
									type="password"
									autoComplete="new-password"
									required
									value={formData.password}
									onChange={handleChange}
									className="block w-full appearance-none rounded-xl border border-gray-300 px-4 py-3 placeholder-gray-400 shadow-sm focus:border-[#0d569e] focus:outline-none focus:ring-2 focus:ring-[#0d569e] transition-all duration-200"
									placeholder="••••••••"
								/>
								<p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
							</div>

							<div>
								<label htmlFor="confirmPassword" className="block text-sm font-semibold text-black mb-2">
									Confirm Password
								</label>
								<input
									id="confirmPassword"
									name="confirmPassword"
									type="password"
									autoComplete="new-password"
									required
									value={formData.confirmPassword}
									onChange={handleChange}
									className="block w-full appearance-none rounded-xl border border-gray-300 px-4 py-3 placeholder-gray-400 shadow-sm focus:border-[#0d569e] focus:outline-none focus:ring-2 focus:ring-[#0d569e] transition-all duration-200"
									placeholder="••••••••"
								/>
							</div>
							{otpSent && (
								<div>
									<label htmlFor="otp" className="block text-sm font-semibold text-black mb-2">
										Enter OTP
									</label>
									<input
										id="otp"
										name="otp"
										type="text"
										required
										value={formData.otp}
										onChange={handleChange}
										className="block w-full appearance-none rounded-xl border border-gray-300 px-4 py-3 placeholder-gray-400 shadow-sm focus:border-[#0d569e] focus:outline-none focus:ring-2 focus:ring-[#0d569e] transition-all duration-200"
										placeholder="Enter 6-digit OTP"
										maxLength={6}
									/>
									<p className="mt-1 text-xs text-gray-500">
										Check your email for the verification code.
									</p>
								</div>
							)}
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
										Creating account...
									</>
								) : (
									'Create account'
								)}
							</button>

							{/* <div className="relative my-6">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t border-gray-300"></div>
								</div>
								<div className="relative flex justify-center text-sm">
									<span className="bg-white px-4 text-gray-500 font-medium">Or sign up with</span>
								</div>
							</div>

							<button
								type="button"
								onClick={async () => {
									const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
									const response = await fetch(`${apiUrl}/api/v1/accounts/linkedin/signin/`);
									const data = await response.json();
									if (data.auth_url) window.location.href = data.auth_url;
								}}
								className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#0A66C2] px-4 py-3 text-sm font-bold text-white hover:bg-[#004182] transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
							>
								<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
									<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
								</svg>
								Sign up with LinkedIn
							</button> */}

							<div className="mt-4 text-center text-xs text-gray-500">
								By signing up, you agree to our{' '}
								<a href="/terms" className="text-[#0d569e] hover:text-[#0a4278]">
									Terms of Service
								</a>{' '}
								and{' '}
								<a href="/privacy" className="text-[#0d569e] hover:text-[#0a4278]">
									Privacy Policy
								</a>
							</div>
						</form>

						<p className="mt-8 text-center text-sm text-gray-600">
							Already have an account?{' '}
							<Link to="/login" className="font-semibold text-[#0d569e] hover:text-[#0a4278] transition-colors">
								Sign in
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
