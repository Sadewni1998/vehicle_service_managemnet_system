import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check, Users, Wrench, Award, Car } from 'lucide-react'

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0)

  const carouselData = [
    {
      id: 1,
      title: "Professional Auto Care Services",
      subtitle: "// Expert Mechanics //",
      image: "/img/carousel-bg-1.jpg",
      carImage: "/img/carousel-1.png"
    },
    {
      id: 2,
      title: "Advanced Diagnostic Technology",
      subtitle: "// Modern Equipment //",
      image: "/img/carousel-bg-2.jpg",
      carImage: "/img/carousel-2.png"
    },
    {
      id: 3,
      title: "Quality Engine Maintenance",
      subtitle: "// Oil & Filter Service //",
      image: "/OIL.jpg",
      carImage: "/img/carousel-1.png"
    },
    {
      id: 4,
      title: "Premium Auto Parts",
      subtitle: "// Genuine Parts //",
      image: "/OIL2.jpg",
      carImage: "/img/carousel-2.png"
    }
  ]

  const services = [
    {
      icon: <Award className="w-12 h-12 text-primary-600" />,
      title: "Quality Servicing",
      description: "At Gear Guard Auto Care, we deliver top-notch service with skilled technicians and advanced tools, ensuring meticulous care for every vehicle."
    },
    {
      icon: <Users className="w-12 h-12 text-primary-600" />,
      title: "Expert Workers",
      description: "Our expert technicians are highly experienced and specially trained to handle all automotive needs with the latest tools and techniques."
    },
    {
      icon: <Wrench className="w-12 h-12 text-primary-600" />,
      title: "Modern Equipment",
      description: "We use state-of-the-art tools and technology to deliver top-quality service with precise diagnostics and efficient repairs."
    }
  ]

  const stats = [
    { number: "15", label: "Years Experience", icon: <Check className="w-8 h-8" /> },
    { number: "30", label: "Expert Technicians", icon: <Users className="w-8 h-8" /> },
    { number: "2000", label: "Satisfied Clients", icon: <Users className="w-8 h-8" /> },
    { number: "20000", label: "Complete Projects", icon: <Car className="w-8 h-8" /> }
  ]

  const serviceTabs = [
    {
      id: 1,
      title: "Diagnostic Test",
      icon: <Car className="w-8 h-8" />,
      image: "/TR1.png",
      description: "With over 15 years of experience in auto servicing, GearUp has established itself as a leader in the automotive industry."
    },
    {
      id: 2,
      title: "Engine Servicing",
      icon: <Car className="w-8 h-8" />,
      image: "/EG1.jpg",
      description: "Our team of skilled technicians brings a wealth of knowledge and expertise to every service and repair job."
    },
    {
      id: 3,
      title: "Oil & Filter Service",
      icon: <Wrench className="w-8 h-8" />,
      image: "/OIL.jpg",
      description: "Whether you need routine maintenance, complex repairs, or specialized modifications, we have the skills and dedication."
    },
    {
      id: 4,
      title: "Premium Parts",
      icon: <Wrench className="w-8 h-8" />,
      image: "/OIL2.jpg",
      description: "At GearUp, our commitment to quality service and customer satisfaction is unmatched."
    }
  ]

  const [activeTab, setActiveTab] = useState(1)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselData.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselData.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselData.length) % carouselData.length)
  }

  return (
    <div>
      {/* Hero Carousel */}
      <div className="relative h-screen overflow-hidden">
        {carouselData.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-50" />
            
            <div className="relative z-10 h-full flex items-center">
              <div className="container-custom">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="text-white">
                    <h6 className="text-lg font-semibold mb-4 text-primary-400">
                      {slide.subtitle}
                    </h6>
                    <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                      {slide.title}
                    </h1>
                    <Link
                      to="/register"
                      className="btn-primary inline-flex items-center space-x-3 text-lg"
                    >
                      <span>Sign in</span>
                      <span>→</span>
                    </Link>
                  </div>
                  <div className="hidden lg:block">
                    <img
                      src={slide.carImage}
                      alt="Car"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all"
        >
          <ChevronRight size={24} />
        </button>

        {/* Carousel Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {carouselData.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
              }`}
            />
          ))}
        </div>
      </div>

      {/*Service Station*/}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className={`flex p-8 rounded-lg ${
                  index === 1 ? 'bg-gray-50' : 'bg-white'
                } hover:shadow-lg transition-shadow`}
              >
                <div className="flex-shrink-0 mr-6">
                  {service.icon}
                </div>
                <div>
                  <h5 className="text-xl font-semibold mb-3">{service.title}</h5>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                    Read More
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img
                src="/img/about.jpg"
                alt="About Us"
                className="w-full h-96 object-cover rounded-lg"
              />
              <div className="absolute top-4 right-4 bg-black bg-opacity-80 text-white p-6 rounded-lg">
                <h1 className="text-4xl font-bold">15 <span className="text-lg">Years</span></h1>
                <h4 className="text-lg">Experience</h4>
              </div>
            </div>
            <div>
              <h6 className="text-primary-600 font-semibold text-lg mb-4">// About Us //</h6>
              <h1 className="text-4xl font-bold mb-6">
                <span className="text-primary-600">GearUp</span> Is The Best Place For Your Auto Care
              </h1>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                GearUp stands out as the premier destination for all your automotive needs. 
                With a commitment to excellence and a passion for cars, we provide unparalleled service and expertise.
              </p>
              
              <div className="space-y-6 mb-8">
                {[
                  {
                    number: "01",
                    title: "Professional & Expert",
                    description: "Our team consists of highly trained technicians with extensive experience in vehicle maintenance, repair, and modification."
                  },
                  {
                    number: "02",
                    title: "Quality Servicing Center",
                    description: "We combine state-of-the-art technology and expert technicians to provide exceptional automotive care."
                  },
                  {
                    number: "03",
                    title: "Awards Winning Workers",
                    description: "Our award-winning professionals are recognized for their excellence in automotive service and dedication."
                  }
                ].map((item, index) => (
                  <div key={index} className="flex">
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                      <span className="font-bold text-gray-600">{item.number}</span>
                    </div>
                    <div>
                      <h6 className="font-semibold text-lg mb-2">{item.title}</h6>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Link to="/about" className="btn-primary inline-flex items-center space-x-3">
                <span>Read More</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-padding bg-gray-900 text-white">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  {stat.icon}
                </div>
                <h2 className="text-4xl font-bold mb-2">{stat.number}</h2>
                <p className="text-gray-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Photo Gallery Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h6 className="text-primary-600 font-semibold text-lg mb-4">// Our Work //</h6>
            <h1 className="text-4xl font-bold">See Our Expert Technicians In Action</h1>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Our skilled mechanics use advanced diagnostic tools and modern equipment to provide the best auto care services.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Mechanic working on engine */}
            <div className="relative group overflow-hidden rounded-lg shadow-lg">
              <img
                src="/EG1.jpg"
                alt="Expert mechanic working on car engine"
                className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
                  <h3 className="text-xl font-bold mb-2">Expert Engine Service</h3>
                  <p className="text-sm">Professional diagnostics and repair</p>
                </div>
              </div>
            </div>

            {/* Diagnostic laptop on car */}
            <div className="relative group overflow-hidden rounded-lg shadow-lg">
              <img
                src="/TR1.png"
                alt="Advanced diagnostic equipment in use"
                className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
                  <h3 className="text-xl font-bold mb-2">Modern Diagnostics</h3>
                  <p className="text-sm">State-of-the-art diagnostic technology</p>
                </div>
              </div>
            </div>

            {/* Oil service */}
            <div className="relative group overflow-hidden rounded-lg shadow-lg">
              <img
                src="/OIL.jpg"
                alt="Premium oil and filter service"
                className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
                  <h3 className="text-xl font-bold mb-2">Oil & Filter Service</h3>
                  <p className="text-sm">Premium quality oil and genuine filters</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Tabs Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h6 className="text-primary-600 font-semibold text-lg mb-4">// Our Services //</h6>
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
                      <Link to="/services" className="btn-primary inline-flex items-center space-x-3">
                        <span>Read More</span>
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
    </div>
  )
}

export default Home

