import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const Testimonials = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

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

  return (
    <div>
      {/* Page Header */}
      <div className="relative h-64 bg-cover bg-center" style={{ backgroundImage: 'url(/img/carousel-bg-1.jpg)' }}>
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Testimonials</h1>
            <nav className="text-sm">
              <span>Home</span> / <span>Pages</span> / <span className="text-primary-400">Testimonials</span>
            </nav>
          </div>
        </div>
      </div>

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
  )
}

export default Testimonials

