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
            <img src="/logo.png" alt="Hybrid Lanka" className="h-12 w-auto" />
            <h3 className="text-4xl font-bold text-primary-600 font-barlow">
              Hybrid Lanka
            </h3>
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
            {/* Breakdown requests */}
            <div>
              <Link
                to="/request"
                className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                <span>Breakdown Requests</span>
              </Link>
            </div>
            {isAuthenticated ? (
              <div className="relative">
                {/* Username Button */}
                <button
                  onClick={() => setIsOpen((prev) => !prev)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition-colors"
                >
                  <span>{user?.name || user?.username}</span>
                  <svg
                    className={`w-4 h-4 transform transition-transform ${
                      isOpen ? "rotate-180" : "rotate-0"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                    {isStaff && (
                      <button
                        onClick={() => {
                          if (user?.role === 'receptionist') {
                            navigate('/receptionist-dashboard')
                          }
                          else if (user?.role === 'mechanic') {
                            navigate('/mechanic-dashboard')
                          }
                          else if (user?.role === 'service-advisor') {
                            navigate('/service-advisor-dashboard')
                          }
                          else if (user?.role === 'manager') {
                            navigate('/management-dashboard')
                          }else {
                            navigate('/admin')
                          }
                          setIsOpen(false)
                        }}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        Dashboard
                      </button>
                    )}
                    {isCustomer && (
                      <Link
                        to="/customer-dashboard"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
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
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-black hover:bg-blue-900 text-white transition-colors"
              >
                <span>Login</span>
              </Link>
            )}
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

              
              {/* Breakdown requests */}
              <div>
                <Link
                  to="/request"
                  className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors text-center w-full justify-center"
                >
                  <span>Breakdown Requests</span>
                </Link>
              </div>
              
              {/* Mobile Login/User Menu */}
              {isAuthenticated ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <span className="text-gray-700">Welcome, {user?.name || user?.username}</span>
                  </div>

                  {/* Dashboard Button */}
                  {isStaff && (
                    <button
                      onClick={() => {
                        if (user?.role === 'receptionist') {
                          navigate('/receptionist-dashboard')
                        } else if (user?.role === 'mechanic') {
                          navigate('/mechanic-dashboard')
                        } else if (user?.role === 'service-advisor') {
                          navigate('/service-advisor-dashboard')
                        } else if (user?.role === 'manager') {
                          navigate('/management-dashboard')
                        } else {
                          navigate('/admin')
                        }
                        setIsOpen(false)
                      }}
                      className="w-full px-6 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium text-center transition-colors"
                    >
                      Dashboard
                    </button>
                  )}

                  {isCustomer && (
                    <button
                      onClick={() => {
                        navigate('/customer-dashboard')
                        setIsOpen(false)
                      }}
                      className="w-full px-6 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium text-center transition-colors"
                    >
                      Dashboard
                    </button>
                  )}

                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      logout(navigate)
                      setIsOpen(false)
                    }}
                    className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors w-full justify-center"
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
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
