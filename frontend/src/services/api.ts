import axios from 'axios'

const baseURL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
	baseURL,
	headers: {
		'Content-Type': 'application/json',
	},
})

// Attach token from localStorage if present
api.interceptors.request.use((cfg) => {
	try {
		const token = localStorage.getItem('authToken')
		if (token) {
			cfg.headers = cfg.headers || {}
			cfg.headers.Authorization = `Bearer ${token}`
		}
	} catch (e) {
		// ignore
	}
	return cfg
})

// Implement token refresh flow for 401 responses.
let isRefreshing = false
let failedQueue: Array<{
	resolve: (token?: string) => void
	reject: (err: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
	failedQueue.forEach((prom) => {
		if (error) prom.reject(error)
		else prom.resolve(token || undefined)
	})
	failedQueue = []
}

api.interceptors.response.use(
	(res) => res,
	async (err) => {
		const originalRequest = err.config
		const status = err?.response?.status

		if (status === 401 && originalRequest && !originalRequest._retry) {
			const refreshToken = (() => {
				try {
					return localStorage.getItem('refreshToken')
				} catch (e) {
					return null
				}
			})()

			if (!refreshToken) {
				try {
					localStorage.removeItem('authToken')
					localStorage.removeItem('refreshToken')
				} catch (e) { }
				if (typeof window !== 'undefined') window.location.href = '/auth/login'
				return Promise.reject(err)
			}

			if (isRefreshing) {
				return new Promise(function (resolve, reject) {
					failedQueue.push({ resolve, reject })
				})
					.then((token) => {
						if (token && originalRequest.headers) originalRequest.headers.Authorization = 'Bearer ' + token
						return api(originalRequest)
					})
					.catch((e) => Promise.reject(e))
			}

			originalRequest._retry = true
			isRefreshing = true

			try {
				const resp = await axios.post(`${baseURL.replace(/\/$/, '')}/auth/token/refresh/`, {
					refresh: refreshToken,
				})
				const newToken = resp.data.access || resp.data.token || resp.data.access_token
				try {
					localStorage.setItem('authToken', newToken)
				} catch (e) { }
				processQueue(null, newToken)
				// attach new token and retry original
				if (originalRequest.headers) originalRequest.headers.Authorization = 'Bearer ' + newToken
				return api(originalRequest)
			} catch (refreshErr) {
				processQueue(refreshErr, null)
				try {
					localStorage.removeItem('authToken')
					localStorage.removeItem('refreshToken')
				} catch (e) { }
				if (typeof window !== 'undefined') window.location.href = '/auth/login'
				return Promise.reject(refreshErr)
			} finally {
				isRefreshing = false
			}
		}

		return Promise.reject(err)
	}
)

export default api
