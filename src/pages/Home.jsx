import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check, Users, Wrench, Award, Car } from 'lucide-react'

const SNOWFLAKE_COUNT = 60

const isSnowSeason = () => {
  const today = new Date()
  const month = today.getMonth()
  const day = today.getDate()
  return (month === 10 && day >= 20) || (month === 11 && day <= 30)
}

const SNOW_CHARACTERS = ["❅", "❆"]

const createSnowflakes = (count = SNOWFLAKE_COUNT) =>
  Array.from({ length: count }, (_, index) => ({
    id: index,
    left: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 6 + Math.random() * 6,
    size: 6 + Math.random() * 10,
    opacity: 0.4 + Math.random() * 0.5,
    blur: Math.random() * 1.5,
    drift: Math.random() * 40 - 20,
    character: SNOW_CHARACTERS[Math.floor(Math.random() * SNOW_CHARACTERS.length)]
  }))

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [showSnow, setShowSnow] = useState(false)
  const [snowflakes, setSnowflakes] = useState([])

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

  useEffect(() => {
    const activeSeason = isSnowSeason()
    setShowSnow(activeSeason)
    setSnowflakes(activeSeason ? createSnowflakes() : [])
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const teamMembers = [
    {
      name: "Pathum Gamage",
      position: "Senior Automotive Engineer",
      image: "/img/team-1.jpg",
      social: {
        facebook: "#",
        twitter: "#",
        instagram: "#"
      }
    },
    {
      name: "Piyumal Kalwin",
      position: "Artificer",
      image: "/img/team-2.jpg",
      social: {
        facebook: "#",
        twitter: "#",
        instagram: "#"
      }
    },
    {
      name: "Archana Sedarage",
      position: "Mechanic Engineer",
      image: "/img/team-3.jpg",
      social: {
        facebook: "#",
        twitter: "#",
        instagram: "#"
      }
    },
    {
      name: "Pubudu Perera",
      position: "Mechanical Technician",
      image: "/img/team-4.jpg",
      social: {
        facebook: "#",
        twitter: "#",
        instagram: "#"
      }
    }
  ]

  const carouselData = [
    {
      id: 1,
      title: "Professional Auto Care Services",
      image: "/img/carousel-bg-1.jpg",
      carImage: "/img/carousel-1.png"
    },
    {
      id: 2,
      title: "Advanced Diagnostic Technology",
      image: "/img/carousel-bg-2.jpg",
      carImage: "/img/carousel-2.png"
    },
    {
      id: 3,
      title: "Quality Engine Maintenance",
      image: "/img/carousel-bg-1.jpg",
      carImage: "/img/carousel-1.png"
    },
    {
      id: 4,
      title: "Premium Auto Parts",
      image: "/img/carousel-bg-2.jpg",
      carImage: "/img/carousel-2.png"
    }
  ]

  const services = [
    {
      icon: <Award className="w-12 h-12 text-primary-600" />,
      title: "Quality Servicing",
      description: "At Hybrid Lanka, we deliver top-notch service with skilled technicians and advanced tools, ensuring meticulous care for every vehicle."
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
    { number: "35", label: "Expert Technicians", icon: <Users className="w-8 h-8" /> },
    { number: "2000", label: "Satisfied Clients", icon: <Users className="w-8 h-8" /> },
    { number: "20000", label: "Complete Projects", icon: <Car className="w-8 h-8" /> }
  ]

  const serviceTabs = [
    {
      id: 1,
      title: "Diagnostic Test",
      icon: <Car className="w-8 h-8" />,
      image: "/img/service-1.jpg",
      description: "With over 15 years of experience in auto servicing, Hybrid Lanka has established itself as a leader in the automotive industry."
    },
    {
      id: 2,
      title: "Engine Servicing",
      icon: <Car className="w-8 h-8" />,
      image: "/img/service-2.jpg",
      description: "Our team of skilled technicians brings a wealth of knowledge and expertise to every service and repair job."
    },
    {
      id: 3,
      title: "Tires Replacement",
      icon: <Wrench className="w-8 h-8" />,
      image: "/img/service-3.jpg",
      description: "Whether you need routine maintenance, complex repairs, or specialized modifications, we have the skills and dedication."
    },
    {
      id: 4,
      title: "Oil Changing",
      icon: <Wrench className="w-8 h-8" />,
      image: "/img/service-4.jpg",
      description: "At Gear Guard Auto Care, our commitment to quality service and customer satisfaction is unmatched."
    }
  ]

  const [activeTab, setActiveTab] = useState(1)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselData.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselData.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselData.length) % carouselData.length)
  }

  return (
    <div className="relative">
      {showSnow && (
        <div className="snow-overlay fixed inset-0 pointer-events-none overflow-hidden">
          {snowflakes.map((flake) => (
            <span
              key={flake.id}
              className="snowflake"
              style={{
                left: `${flake.left}%`,
                animationDelay: `${flake.delay}s`,
                animationDuration: `${flake.duration}s`,
                fontSize: `${flake.size}px`,
                opacity: flake.opacity,
                filter: `blur(${flake.blur}px)`,
                '--snowflake-drift': `${flake.drift}px`
              }}
            >
              {flake.character}
            </span>
          ))}
        </div>
      )}
      {/* Hero Carousel */}
      <div className="relative h-screen overflow-hidden">
        {carouselData.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-200 ${
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
                    <h6 className="text-lg font-semibold mb-4 text-primary-400 uppercase">
                      {slide.subtitle}
                    </h6>
                    <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight font-barlow">
                      {slide.title}
                    </h1>
                    <Link
                      to="/booking"
                      className="btn-primary inline-flex items-center space-x-3 text-lg"
                    >
                      <span>Book Now</span>
                      <span>→</span>
                    </Link>
                  </div>
                  <div className="hidden lg:block">
                    <img
                      src={slide.carImage}
                      alt="Car"
                      className={`w-full h-auto transition-transform duration-[1000ms] ease-in-out ${index === currentSlide ? "scale-110" : "scale-100"
                      }`}
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
              <h1 className="text-4xl font-bold mb-6 font-barlow">
                <span className="text-primary-600">Hybrid Lanka</span> Is The Best Place For Your Auto Care
              </h1>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Hybrid Lanka stands out as the premier destination for all your automotive needs.
                With a commitment to excellence and a passion for cars, Hybrid Lanka provides unparalleled service and expertise.
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

            {/* Services Tabs Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold font-barlow">Explore Our Services</h1>
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

      {/* Photo Gallery Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold font-barlow">See Our Expert Technicians In Action</h1>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Our skilled mechanics use advanced diagnostic tools and modern equipment to provide the best auto care services.
            </p>
          </div>
          {/* Team Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {teamMembers.map((member, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="relative overflow-hidden group">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-6 text-center">
                      <h5 className="text-xl font-bold mb-2">{member.name}</h5>
                      <p className="text-gray-600">{member.position}</p>
                    </div>
                  </div>
                ))}
              </div>

          {/* Team Stats */}
          <section className="section-padding bg-gray-50">
            <div className="container-custom">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Why Choose Our Team?</h2>
                <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                  Our team of expert technicians brings years of experience and specialized training to every job. 
                  We're committed to providing the highest quality service and ensuring your complete satisfaction.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: <Users className="w-12 h-12 text-primary-600" />,
                    title: "Expert Technicians",
                    description: "Our team consists of certified professionals with extensive experience in automotive repair and maintenance."
                  },
                  {
                    icon: <Users className="w-12 h-12 text-primary-600" />,
                    title: "Continuous Training",
                    description: "We invest in ongoing education to stay current with the latest automotive technologies and repair techniques."
                  },
                  {
                    icon: <Users className="w-12 h-12 text-primary-600" />,
                    title: "Customer Focused",
                    description: "Every team member is dedicated to providing exceptional customer service and building long-term relationships."
                  }
                ].map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="flex justify-center mb-4">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      </section>

      <div>
        {/* Testimonials Carousel */}
        <section className="section-padding bg-white">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold">Our Clients Say!</h1>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Testimonial Content */}
                <div className="text-center">
                  <img
                    src={testimonials[currentTestimonial].image}
                    alt={testimonials[currentTestimonial].name}
                    className="w-20 h-20 rounded-full mx-auto mb-6 object-cover"
                  />
                  <h5 className="text-2xl font-semibold mb-6">{testimonials[currentTestimonial].name}</h5>
                  <div className="bg-gray-50 rounded-lg p-8 mb-8">
                    <p className="text-lg text-gray-700 italic">
                      "{testimonials[currentTestimonial].text}"
                    </p>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <button
                  onClick={prevTestimonial}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={nextTestimonial}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-full transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              {/* Indicators */}
              <div className="flex justify-center space-x-2 mt-8">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentTestimonial ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* All Testimonials Grid */}
        <section className="section-padding bg-gray-50">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">What Our Customers Say</h2>
              <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                Don't just take our word for it. Here's what our satisfied customers have to say about their experience with Hybrid Lanka.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h5 className="text-lg font-semibold mb-3">{testimonial.name}</h5>
                  <p className="text-gray-600 italic text-sm">"{testimonial.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="section-padding bg-primary-600 text-white">
          <div className="container-custom text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Experience Our Service?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of satisfied customers who trust Hybrid Lanka for their automotive needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/booking" className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors">
                Book a Service
              </a>
              <a href="/contact" className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-3 px-8 rounded-lg transition-colors">
                Contact Us
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Home