import { Link } from 'react-router-dom'
import { Check, Users, Award, Car } from 'lucide-react'

const About = () => {
  const stats = [
    { number: "15", label: "Years Experience", icon: <Check className="w-8 h-8" /> },
    { number: "30", label: "Expert Technicians", icon: <Users className="w-8 h-8" /> },
    { number: "2000", label: "Satisfied Clients", icon: <Users className="w-8 h-8" /> },
    { number: "20000", label: "Complete Projects", icon: <Car className="w-8 h-8" /> }
  ]

  const teamMembers = [
    {
      name: "Pathum Gamage",
      position: "Senior Automotive Engineer",
      image: "/img/team-1.jpg"
    },
    {
      name: "Piyumal Kalwin",
      position: "Artificer",
      image: "/img/team-2.jpg"
    },
    {
      name: "Archana Sedarage",
      position: "Mechanic Engineer",
      image: "/img/team-3.jpg"
    },
    {
      name: "Pubudu Perera",
      position: "Mechanical Technician",
      image: "/img/team-4.jpg"
    }
  ]

  return (
    <div>
      {/* Page Header */}
      <div className="relative h-64 bg-cover bg-center" style={{ backgroundImage: 'url(/img/carousel-bg-1.jpg)' }}>
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">About Us</h1>
            <nav className="text-sm">
              <span>Home</span> / <span>Pages</span> / <span className="text-primary-400">About</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Award className="w-12 h-12 text-primary-600" />,
                title: "Quality Servicing",
                description: "At GearUp, we deliver top-notch service with skilled technicians and advanced tools, ensuring meticulous care for every vehicle."
              },
              {
                icon: <Users className="w-12 h-12 text-primary-600" />,
                title: "Expert Workers",
                description: "Our expert technicians are highly experienced and specially trained to handle all automotive needs with the latest tools and techniques."
              },
              {
                icon: <Car className="w-12 h-12 text-primary-600" />,
                title: "Modern Equipment",
                description: "We use state-of-the-art tools and technology to deliver top-quality service with precise diagnostics and efficient repairs."
              }
            ].map((service, index) => (
              <div key={index} className="flex p-8 rounded-lg hover:shadow-lg transition-shadow">
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
                <span className="text-primary-600">GearGard Auto Care</span> Is The Best Place For Your Auto Care
              </h1>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                GearUp stands out as the premier destination for all your automotive needs. 
                With a commitment to excellence and a passion for cars, GearUp provides unparalleled service and expertise. 
                Whether you require routine maintenance, complex repairs, or custom modifications, our skilled technicians are dedicated to ensuring your vehicle receives the utmost care and attention.
              </p>
              
              <div className="space-y-6 mb-8">
                {[
                  {
                    number: "01",
                    title: "Professional & Expert",
                    description: "GearUp is home to a team of professionals and experts dedicated to providing exceptional automotive service. Our staff consists of highly trained technicians with extensive experience in vehicle maintenance, repair, and modification."
                  },
                  {
                    number: "02",
                    title: "Quality Servicing Center",
                    description: "GearUp's quality servicing center combines state-of-the-art technology and expert technicians to provide exceptional automotive care, ensuring meticulous attention to detail and customer satisfaction with every service."
                  },
                  {
                    number: "03",
                    title: "Awards Winning Workers",
                    description: "Our team at GearUp consists of award-winning professionals who are recognized for their excellence in automotive service. These skilled technicians have been honored for their dedication, expertise, and commitment to providing exceptional care for vehicles."
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
              
              <Link to="/services" className="btn-primary inline-flex items-center space-x-3">
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

      {/* Team Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h6 className="text-primary-600 font-semibold text-lg mb-4">// Our Technicians //</h6>
            <h1 className="text-4xl font-bold">Our Expert Technicians</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 hover:opacity-100 transition-opacity duration-300 flex space-x-3">
                      {['facebook', 'twitter', 'instagram'].map((social) => (
                        <a
                          key={social}
                          href="#"
                          className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary-600 hover:bg-primary-600 hover:text-white transition-colors"
                        >
                          <span className="text-sm font-bold">{social[0].toUpperCase()}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-6 text-center">
                  <h5 className="text-xl font-bold mb-2">{member.name}</h5>
                  <p className="text-gray-600">{member.position}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
