import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, Facebook, Twitter, Youtube, Linkedin } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="footer bg-gray-900 text-white">
      <div className="container-custom section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Address */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Address</h4>
            <div className="space-y-2 text-gray-300">
              <p className="flex items-center">
                <MapPin className="w-4 h-4 mr-3 text-primary-600" />
                134/3 Horana road, Piliyandala
              </p>
              <p className="flex items-center">
                <Phone className="w-4 h-4 mr-3 text-primary-600" />
                +94 112 620 757
              </p>
              <p className="flex items-center">
                <Mail className="w-4 h-4 mr-3 text-primary-600" />
                info@hybridlanka.com
              </p>
            </div>
            <div className="flex space-x-2 mt-4">
              <a href="#" className="btn btn-social">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="btn btn-social">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="btn btn-social">
                <Youtube className="w-4 h-4" />
              </a>
              <a href="#" className="btn btn-social">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Opening Hours */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Opening Hours</h4>
            <div className="space-y-2 text-gray-300">
              <div>
                <h6 className="text-white font-medium">Monday - Friday:</h6>
                <p>07.30 AM - 07.30 PM</p>
              </div>
              <div>
                <h6 className="text-white font-medium">Saturday - Sunday:</h6>
                <p>07.30 AM - 12.00 PM</p>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Services</h4>
            <div className="space-y-2">
              {[
                'Diagnostic Test',
                'Engine Servicing',
                'Tires Replacement',
                'Oil Changing',
                'Vacuum Cleaning'
              ].map((service) => (
                <Link
                  key={service}
                  to="/services"
                  className="btn btn-link block text-left text-white hover:text-primary-400 transition-colors"
                >
                  {service}
                </Link>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Newsletter</h4>
            <p className="text-gray-300 mb-4">
              "Hybrid Lanka Summer Special: Beat the heat with our Summer Service Special! 
              A/C check, coolant inspection, tire rotation, fluid top-off. Mention promo code "SUMMERGGAC."
            </p>
            <div className="flex max-w-md">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-3 bg-gray-800 border-0 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button className="bg-primary-600 hover:bg-primary-700 px-6 py-3 transition-colors btn">
                SignUp
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              © Hybrid Lanka, All Right Reserved. Designed By Group 25
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                Home
              </Link>
              <Link to="/about" className="text-gray-400 hover:text-white text-sm transition-colors">
                About
              </Link>
              <Link to="/contact" className="text-gray-400 hover:text-white text-sm transition-colors">
                Help
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

