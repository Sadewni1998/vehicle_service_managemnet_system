import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container-custom section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Address */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Address</h4>
            <div className="space-y-2 text-gray-300">
              <p className="flex items-center">
                <span className="mr-3">📍</span>
                Old Road Pannipitiya, Colombo, Sri Lanka
              </p>
              <p className="flex items-center">
                <span className="mr-3">📞</span>
                +94 11 2 222 3223
              </p>
              <p className="flex items-center">
                <span className="mr-3">✉️</span>
                info@gearup.com
              </p>
            </div>
            <div className="flex space-x-3 mt-4">
              {['twitter', 'facebook', 'youtube', 'linkedin'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors"
                >
                  <span className="text-sm font-bold">{social[0].toUpperCase()}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Opening Hours */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Opening Hours</h4>
            <div className="space-y-2 text-gray-300">
              <div>
                <h6 className="text-white font-medium">Monday - Friday:</h6>
                <p>09.00 AM - 09.00 PM</p>
              </div>
              <div>
                <h6 className="text-white font-medium">Saturday - Sunday:</h6>
                <p>09.00 AM - 12.00 PM</p>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Services</h4>
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
                  className="block text-gray-300 hover:text-primary-400 transition-colors"
                >
                  {service}
                </Link>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Newsletter</h4>
            <p className="text-gray-300 mb-4">
              "GearUp Summer Special: Beat the heat with our Summer Service Special! 
              A/C check, coolant inspection, tire rotation, fluid top-off. Mention promo code "SUMMERGEARUP."
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button className="bg-primary-600 hover:bg-primary-700 px-6 py-3 rounded-r-lg transition-colors">
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
              © GearUp, All Right Reserved. Designed By Group 25
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

