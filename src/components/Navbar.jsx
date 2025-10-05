import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAuthenticated, userType, isStaff, isCustomer } = useAuth()

  const isActive = (path) => location.pathname === path

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/services', label: 'Services' },
    { path: '/contact', label: 'Contact' },
  ]

  const dropdownItems = [
    { path: '/request', label: 'Request' },
    { path: '/parts', label: 'Parts' },
  ]

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 py-4">
            <img src="/logo.png" alt="Hybrid Lanka" className="w-25 h-16" />
            <h2 className="text-5xl font-bold text-primary-600 font-barlow">
              Hybrid Lanka
            </h2>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`uppercase text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Login/User Menu - Desktop */}
          <div className="hidden lg:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome, {user?.name || user?.username}</span>
                {isStaff && (
                  <Link
                    to={user?.role === 'receptionist' ? '/receptionist-dashboard' : '/admin'}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
                {isCustomer && (
                  <Link
                    to="/customer-dashboard"
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={() => logout(navigate)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-black hover:bg-blue-900 text-white transition-colors"
              >
                <span>Login</span>
              </Link>
            )}
              <Link
                to="/request"
                className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                <span>Breakdown Requests</span>
              </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-primary-600'
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}


              {/* Mobile Login/User Menu */}
              {isAuthenticated ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <span className="text-gray-700">Welcome, {user?.name || user?.username}</span>
                  </div>
                  {isStaff && (
                    <Link
                      to={user?.role === 'receptionist' ? '/receptionist-dashboard' : '/admin'}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors w-full justify-center"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  {isCustomer && (
                    <Link
                      to="/customer-dashboard"
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors w-full justify-center"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout(navigate)
                      setIsOpen(false)
                    }}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors w-full justify-center"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-black hover:bg-blue-900 text-white transition-colors text-center w-full justify-center"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
              )}

              {/* Breakdown requests */}
              <div>
                <Link
                  to="/request"
                  className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors text-center w-full justify-center"
                >
                  <span>Breakdown Requests</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
