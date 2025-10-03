import { useState } from 'react'
import { Search, Filter, ShoppingCart, Star } from 'lucide-react'

const Parts = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedBrand, setSelectedBrand] = useState('all')

  const categories = ['All', 'Engine Parts', 'Brake Parts', 'Suspension', 'Electrical', 'Body Parts', 'Filters', 'Fluids']
  const brands = ['All', 'Toyota', 'Honda', 'Suzuki', 'Ford', 'Mazda', 'Isuzu', 'Subaru']

  const parts = [
    {
      id: 1,
      name: "Engine Oil Filter",
      category: "Filters",
      brand: "Toyota",
      price: 2500,
      originalPrice: 3000,
      rating: 4.5,
      image: "/img/service-1.jpg",
      inStock: true,
      description: "High-quality engine oil filter for optimal engine performance and protection."
    },
    {
      id: 2,
      name: "Brake Pads Set",
      category: "Brake Parts",
      brand: "Honda",
      price: 8500,
      originalPrice: 10000,
      rating: 4.8,
      image: "/img/service-2.jpg",
      inStock: true,
      description: "Premium brake pads for superior stopping power and durability."
    },
    {
      id: 3,
      name: "Air Filter",
      category: "Filters",
      brand: "Suzuki",
      price: 1800,
      originalPrice: 2200,
      rating: 4.3,
      image: "/img/service-3.jpg",
      inStock: true,
      description: "High-efficiency air filter for clean engine air intake."
    },
    {
      id: 4,
      name: "Spark Plugs Set",
      category: "Engine Parts",
      brand: "Ford",
      price: 4500,
      originalPrice: 5500,
      rating: 4.6,
      image: "/img/service-4.jpg",
      inStock: false,
      description: "Iridium spark plugs for improved fuel efficiency and performance."
    },
    {
      id: 5,
      name: "Shock Absorber",
      category: "Suspension",
      brand: "Mazda",
      price: 12000,
      originalPrice: 15000,
      rating: 4.7,
      image: "/img/service-1.jpg",
      inStock: true,
      description: "Heavy-duty shock absorber for smooth and comfortable ride."
    },
    {
      id: 6,
      name: "Headlight Bulb",
      category: "Electrical",
      brand: "Isuzu",
      price: 3200,
      originalPrice: 4000,
      rating: 4.4,
      image: "/img/service-2.jpg",
      inStock: true,
      description: "LED headlight bulb for bright and energy-efficient lighting."
    }
  ]

  const filteredParts = parts.filter(part => {
    const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || part.category === selectedCategory
    const matchesBrand = selectedBrand === 'all' || part.brand === selectedBrand
    
    return matchesSearch && matchesCategory && matchesBrand
  })

  return (
    <div>
      {/* Page Header */}
      <div className="relative h-64 bg-cover bg-center" style={{ backgroundImage: 'url(/img/carousel-bg-1.jpg)' }}>
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Auto Parts</h1>
            <nav className="text-sm">
              <span>Home</span> / <span>Pages</span> / <span className="text-primary-400">Parts</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Parts Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-6">Quality Auto Parts & Accessories</h1>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Find genuine and high-quality auto parts for your vehicle. We offer competitive prices and 15% discount when purchased with service.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for parts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
                >
                  {categories.map(category => (
                    <option key={category} value={category.toLowerCase()}>{category}</option>
                  ))}
                </select>
              </div>
              
              {/* Brand Filter */}
              <div className="relative">
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="pl-4 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
                >
                  {brands.map(brand => (
                    <option key={brand} value={brand.toLowerCase()}>{brand}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Parts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredParts.map((part) => (
              <div key={part.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative">
                  <img
                    src={part.image}
                    alt={part.name}
                    className="w-full h-48 object-cover"
                  />
                  {!part.inStock && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Out of Stock
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {part.category}
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{part.name}</h3>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm text-gray-600">{part.rating}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">{part.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-primary-600">Rs. {part.price.toLocaleString()}</span>
                      <span className="text-sm text-gray-500 line-through ml-2">Rs. {part.originalPrice.toLocaleString()}</span>
                    </div>
                    <span className="text-sm text-gray-500">{part.brand}</span>
                  </div>
                  
                  <button
                    disabled={!part.inStock}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center ${
                      part.inStock
                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {part.inStock ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredParts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No parts found matching your criteria.</p>
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Our Parts?</h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              We provide only the highest quality auto parts with competitive pricing and excellent customer service.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Genuine Quality",
                description: "All our parts are genuine and meet manufacturer specifications for optimal performance and reliability."
              },
              {
                title: "Competitive Pricing",
                description: "Get the best prices on quality auto parts with our 15% service discount and regular promotions."
              },
              {
                title: "Expert Installation",
                description: "Our certified technicians can install your parts with professional service and warranty coverage."
              }
            ].map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">{index + 1}</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Parts


