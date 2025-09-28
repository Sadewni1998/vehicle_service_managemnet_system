import { Users } from 'lucide-react'

const Team = () => {
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

  return (
    <div>
      {/* Page Header */}
      <div className="relative h-64 bg-cover bg-center" style={{ backgroundImage: 'url(/img/carousel-bg-1.jpg)' }}>
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Our Technicians</h1>
            <nav className="text-sm">
              <span>Home</span> / <span>Pages</span> / <span className="text-primary-400">Technicians</span>
            </nav>
          </div>
        </div>
      </div>

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
                <div className="relative overflow-hidden group">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-3">
                      {Object.entries(member.social).map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url}
                          className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary-600 hover:bg-primary-600 hover:text-white transition-colors"
                        >
                          <span className="text-sm font-bold">{platform[0].toUpperCase()}</span>
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
  )
}

export default Team


