import { useState } from 'react'
import { Car, Wrench, Check } from 'lucide-react'
import { Link } from "react-router-dom"

const Services = () => {
  const [activeTab, setActiveTab] = useState(1)

  const serviceTabs = [
    {
      id: 1,
      title: "Diagnostic Test",
      icon: <Car className="w-8 h-8" />,
      image: "/img/service-1.jpg",
      description: "With over 15 years of experience in auto servicing, Hybrid Lank has established itself as a leader in the automotive industry. Our team of skilled technicians brings a wealth of knowledge and expertise to every service and repair job."
    },
    {
      id: 2,
      title: "Engine Servicing",
      icon: <Car className="w-8 h-8" />,
      image: "/img/service-2.jpg",
      description: "Our team of skilled technicians brings a wealth of knowledge and expertise to every service and repair job. Whether you need routine maintenance, complex repairs, or specialized modifications, we have the skills and dedication to ensure your vehicle receives top-notch care."
    },
    {
      id: 3,
      title: "Tires Replacement",
      icon: <Wrench className="w-8 h-8" />,
      image: "/img/service-3.jpg",
      description: "Whether you need routine maintenance, complex repairs, or specialized modifications, we have the skills and dedication to ensure your vehicle receives top-notch care. At Hybrid Lanka, our commitment to quality service and customer satisfaction is unmatched."
    },
    {
      id: 4,
      title: "Oil Changing",
      icon: <Wrench className="w-8 h-8" />,
      image: "/img/service-4.jpg",
      description: "At Hybrid Lanka, our commitment to quality service and customer satisfaction is unmatched, making us the go-to choice for auto care needs. We provide comprehensive oil change services with high-quality oils and filters."
    }
  ]

  const testimonials = [
    {
      name: "Manuja Archana",
      image: "/img/testimonial-1.jpg",
      text: "Hybrid Lanka is simply the best! Their expertise and attention to detail are unmatched. I wouldn't trust my car with anyone else."
    },
    {
      name: "Disnaka Kalwin",
      image: "/img/testimonial-2.jpg",
      text: "I've been taking my car to Hybrid Lanka for years. Their service is consistently excellent, and their staff is friendly and knowledgeable."
    },
    {
      name: "Senumi Chanya",
      image: "/img/testimonial-3.jpg",
      text: "Hybrid Lanka fixed an issue with my car that other mechanics couldn't. I'm so thankful for their expertise and dedication."
    },
    {
      name: "Buddhima Wijewardhane",
      image: "/img/testimonial-4.jpg",
      text: "I always recommend Hybrid Lanka to friends and family. They provide reliable service and go above and beyond to ensure customer satisfaction."
    }
  ]

  return (
    <div>
      {/* Page Header */}
      <div className="relative h-64 bg-cover bg-center" style={{ backgroundImage: 'url(/img/carousel-bg-2.jpg)' }}>
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Services</h1>
            <nav className="text-sm">
              <span>Home</span> / <span>Pages</span> / <span className="text-primary-400">Services</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Services Tabs Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold">Explore Our Services</h1>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Service Tabs */}
            <div className="lg:col-span-1">
              <div className="space-y-4">
                {serviceTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center p-6 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="mr-4">
                      {tab.icon}
                    </div>
                    <h4 className="text-lg font-semibold">{tab.title}</h4>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Service Content */}
            <div className="lg:col-span-3">
              {serviceTabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`transition-all duration-300 ${
                    activeTab === tab.id ? 'opacity-100 block' : 'opacity-0 hidden'
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="h-80">
                      <img
                        src={tab.image}
                        alt={tab.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-4">15 Years Of Experience In Auto Servicing</h3>
                      <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                        {tab.description}
                      </p>
                      <div className="space-y-3 mb-6">
                        {['Quality Servicing', 'Expert Workers', 'Modern Equipment'].map((item) => (
                          <div key={item} className="flex items-center">
                            <Check className="w-5 h-5 text-green-500 mr-3" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                      <Link 
                        to="/booking" 
                        className="btn-primary inline-flex items-center space-x-3"
                      >
                        <span>Book Now</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold">Our Clients Say!</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 text-center">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                />
                <h5 className="text-lg font-semibold mb-4">{testimonial.name}</h5>
                <p className="text-gray-600 italic">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Services

