import React from 'react'
import { Link, Outlet } from 'react-router-dom'

const Header: React.FC = () => (
  <header className="bg-white border-b">
    <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-xl font-bold">LinkedIn Agent</Link>
        <nav className="hidden sm:flex gap-3">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
          <Link to="/posts" className="text-sm text-gray-600 hover:text-gray-900">Posts</Link>
        </nav>
      </div>
      <div>
        <a href="/auth/login" className="text-sm text-primary-600">Sign in</a>
      </div>
    </div>
  </header>
)

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
