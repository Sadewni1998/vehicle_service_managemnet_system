import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import About from './pages/About'
import Services from './pages/Services'
import Booking from './pages/Booking'
import Request from './pages/Request'
import Contact from './pages/Contact'
import Parts from './pages/Parts'
import Login from './pages/Login'
import Register from './pages/Register'
import Admin from './pages/Admin'
import CustomerDashboard from './pages/CustomerDashboard'
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-white">
          <Navbar />
          <main>
            <Routes>
              <Route path="/admin" element={<Admin/>}/>
              <Route path="/customer-dashboard" element={<CustomerDashboard />} />
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/request" element={<Request />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/parts" element={<Parts />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </main>
          <Footer />
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
