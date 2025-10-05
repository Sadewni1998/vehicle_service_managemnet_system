import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Car, Wrench, CheckCircle, AlertCircle } from 'lucide-react'
import { bookingsAPI, authAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");
const minDate = `${yyyy}-${mm}-${dd}`;

const timeSlots = ['07:30 AM - 09:00 AM', '09:00 AM - 10:30 AM', '10:30 AM - 12:00 PM', '12:30 PM - 02:00 PM', '02:00 PM - 03:30 PM', '03:30 PM - 05:00 PM', '05:00 PM - 06:30 PM', '06:30 PM - 07:30 PM']

const Booking = () => {
  const { user, isAuthenticated } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingAvailability, setBookingAvailability] = useState({
    isAvailable: true,
    currentCount: 0,
    limit: 8,
    remainingSlots: 8,
    message: ''
  })
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(true)
  const [timeSlotAvailability, setTimeSlotAvailability] = useState({
    availableTimeSlots: [],
    bookedTimeSlots: [],
    isLoading: true
  })
  const [selectedDate, setSelectedDate] = useState('')
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm()

  // Check booking availability on component mount
  useEffect(() => {
    checkBookingAvailability()
  }, [])

  // Auto-populate customer data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setValue('name', user.name || '')
      setValue('phone_number', user.phone || '')
    }
  }, [isAuthenticated, user, setValue])

  // Watch for date changes to update time slot availability
  const watchedDate = watch('service_date')
  useEffect(() => {
    if (watchedDate) {
      setSelectedDate(watchedDate)
      checkTimeSlotAvailability(watchedDate)
    }
  }, [watchedDate])

  const checkBookingAvailability = async () => {
    try {
      setIsCheckingAvailability(true)
      const response = await fetch('http://localhost:5000/api/bookings/availability')
      const data = await response.json()
      setBookingAvailability(data)
    } catch (error) {
      console.error('Error checking booking availability:', error)
      toast.error('Failed to check booking availability')
    } finally {
      setIsCheckingAvailability(false)
    }
  }

  const checkTimeSlotAvailability = async (date) => {
    try {
      setTimeSlotAvailability(prev => ({ ...prev, isLoading: true }))
      const response = await fetch(`http://localhost:5000/api/bookings/time-slots?date=${date}`)
      const data = await response.json()
      setTimeSlotAvailability({
        availableTimeSlots: data.availableTimeSlots || [],
        bookedTimeSlots: data.bookedTimeSlots || [],
        isLoading: false
      })
    } catch (error) {
      console.error('Error checking time slot availability:', error)
      toast.error('Failed to check time slot availability')
      setTimeSlotAvailability(prev => ({ ...prev, isLoading: false }))
    }
  }

  // Helper function to check if a time slot is in the past
  const isTimeSlotInPast = (timeSlot, selectedDate) => {
    if (!selectedDate || !timeSlot) return false
    
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0] // Get today's date as YYYY-MM-DD
    
    // If selected date is in the future, no time slots are in the past
    if (selectedDate > todayStr) return false
    
    // If selected date is in the past, all time slots are in the past
    if (selectedDate < todayStr) return true
    
    // If selected date is today, check if the time slot has passed
    if (selectedDate === todayStr) {
      const currentTime = today.getHours() * 60 + today.getMinutes()
      
      // Extract start time from time slot (e.g., "07:30 AM - 09:00 AM" -> "07:30 AM")
      const startTimeStr = timeSlot.split(' - ')[0]
      const [time, period] = startTimeStr.split(' ')
      const [hours, minutes] = time.split(':').map(Number)
      
      let slotStartMinutes = hours * 60 + minutes
      
      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) {
        slotStartMinutes += 12 * 60
      } else if (period === 'AM' && hours === 12) {
        slotStartMinutes -= 12 * 60
      }
      
      return currentTime > slotStartMinutes
    }
    
    return false
  }

  const onSubmit = async (data) => {
    // Check if booking is still available before submitting
    if (!bookingAvailability.isAvailable) {
      toast.error('Booking limit reached for today. Please try again tomorrow.')
      return
    }

    // Check if selected time slot is in the past
    if (isTimeSlotInPast(data.time_slots, data.service_date)) {
      toast.error('The selected time slot is in the past. Please choose a future time slot.')
      return
    }

    // Check if selected time slot is still available
    if (timeSlotAvailability.bookedTimeSlots.includes(data.time_slots)) {
      toast.error('The selected time slot is no longer available. Please choose another time slot.')
      // Refresh time slot availability
      if (selectedDate) {
        await checkTimeSlotAvailability(selectedDate)
      }
      return
    }

    setIsSubmitting(true)
    try {
      // Transform form data to match backend expectations
      const bookingData = {
        name: data.name,
        phone: data.phone_number,
        vehicleNumber: data.vehicle_number,
        vehicleType: data.vehicle_type,
        fuelType: data.fuel_type,
        vehicleBrand: data.vehicle_brand,
        vehicleBrandModel: data.vehicle_brand_model,
        manufacturedYear: data.manufactured_year,
        transmissionType: data.transmission_type,
        kilometersRun: data.kilometers_run,
        bookingDate: data.service_date,
        timeSlot: data.time_slots, // Add timeSlot field
        serviceTypes: data.services || [],
        specialRequests: data.special_requests
      }
      
      const response = await bookingsAPI.create(bookingData)
      toast.success('Booking submitted successfully!')
      reset()
      
      // Refresh booking availability and time slots after successful booking
      await checkBookingAvailability()
      if (selectedDate) {
        await checkTimeSlotAvailability(selectedDate)
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit booking. Please try again.'
      toast.error(message)
      console.error('Booking error:', error)
      
      // If it's a limit reached error, refresh availability
      if (error.response?.status === 429) {
        await checkBookingAvailability()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div className="relative h-64 bg-cover bg-center" style={{ backgroundImage: 'url(/img/carousel-bg-1.jpg)' }}>
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Booking</h1>
            <nav className="text-sm">
              <span>Home</span> / <span>Pages</span> / <span className="text-primary-400">Booking</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Services Info */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: <CheckCircle className="w-12 h-12 text-primary-600" />,
                title: "Quality Servicing",
                description: "At Hybrid Lanka, we deliver top-notch service with skilled technicians and advanced tools, ensuring meticulous care for every vehicle."
              },
              {
                icon: <Wrench className="w-12 h-12 text-primary-600" />,
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

      {/* Booking Form */}
      <section className="section-padding bg-gray-900">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Side - Info */}
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl font-bold text-white mb-6">
                Certified and Award Winning Car Repair Service Provider
              </h1>
              <p className="text-white text-lg leading-relaxed">
                Hybrid Lanka is a certified, award-winning car repair service provider committed to excellence. 
                We have a team of skilled technicians equipped with the latest tools and technology to provide top-quality 
                repairs and maintenance. Our dedication to customer satisfaction and high standards of service has earned 
                us numerous awards and certifications in the automotive industry.
              </p>
            </div>

            {/* Right Side - Form */}
            <div className="bg-primary-600 p-8 rounded-lg">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">Book For A Service</h2>
              
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Name with Initials"
                      className="w-full px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white"
                      {...register('name', { required: 'Name is required' })}
                    />
                    {errors.name && <p className="text-red-200 text-sm mt-1">{errors.name.message}</p>}
                  </div>
                  
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      className="w-full px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white"
                      {...register('phone_number', { required: 'Phone number is required' })}
                    />
                    {errors.phone_number && <p className="text-red-200 text-sm mt-1">{errors.phone_number.message}</p>}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Vehicle Number"
                      className="w-full px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white"
                      {...register('vehicle_number', { required: 'Vehicle number is required' })}
                    />
                    {errors.vehicle_number && <p className="text-red-200 text-sm mt-1">{errors.vehicle_number.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date input */}
                  <div>
                    <input
                      type="date"
                      placeholder="Service Date"
                      className="block w-full h-[48px] px-4 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-white appearance-none"
                      min={minDate}  
                      {...register('service_date', { required: 'Service date is required' })}
                    />
                    {errors.service_date && (
                      <p className="text-red-200 text-sm mt-1">
                        {errors.service_date.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <select
                      className="block w-full h-[48px] px-4 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-white appearance-none"
                      defaultValue=""
                      {...register('time_slots', { 
                        required: 'Time slot is required',
                        validate: (value) => {
                          if (!selectedDate) return 'Please select a date first'
                          if (isTimeSlotInPast(value, selectedDate)) {
                            return 'This time slot is in the past'
                          }
                          if (timeSlotAvailability.bookedTimeSlots.includes(value)) {
                            return 'This time slot is no longer available'
                          }
                          return true
                        }
                      })}
                      disabled={!selectedDate || timeSlotAvailability.isLoading}
                    >
                      <option value="" disabled hidden>
                        {!selectedDate 
                          ? 'Select Date First' 
                          : timeSlotAvailability.isLoading 
                          ? 'Loading time slots...' 
                          : 'Select Time Slot'
                        }
                      </option>
                      {timeSlots.map((slot) => {
                        const isAvailable = timeSlotAvailability.availableTimeSlots.includes(slot)
                        const isBooked = timeSlotAvailability.bookedTimeSlots.includes(slot)
                        const isInPast = isTimeSlotInPast(slot, selectedDate)
                        const isDisabled = isBooked || isInPast
                        
                        let statusText = ''
                        if (isInPast) {
                          statusText = '(Past)'
                        } else if (isBooked) {
                          statusText = '(Booked)'
                        } else if (isAvailable) {
                          statusText = '(Available)'
                        }
                        
                        return (
                          <option 
                            key={slot} 
                            value={slot}
                            disabled={isDisabled}
                            className={
                              isInPast 
                                ? 'text-gray-500 bg-gray-200' 
                                : isBooked 
                                ? 'text-gray-400 bg-gray-100' 
                                : ''
                            }
                          >
                            {slot} {statusText}
                          </option>
                        )
                      })}
                    </select>
                    {errors.time_slots && (
                      <p className="text-red-200 text-sm mt-1">
                        {errors.time_slots.message}
                      </p>
                    )}
                  </div>
                </div>

                                
                {/*Services Checkboxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
                  <div className="grid grid-cols-1 gap-3">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" value="fullservice" {...register("services")} />
                      <span>Full Service</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" value="engine" {...register("services")} />
                      <span>Engine Servicing</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" value="transmission" {...register("services")} />
                      <span>Transmission Service</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" value="oil" {...register("services")} />
                      <span>Oil & Filter Service</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" value="wash" {...register("services")} />
                      <span>Body Wash</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" value="diagnostic" {...register("services")} />
                      <span>Diagnostic Test</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" value="tire" {...register("services")} />
                      <span>Wheel Alignment</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" value="vacuum" {...register("services")} />
                      <span>Vacuum Cleaning</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <textarea
                    placeholder="Special Requests"
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white"
                    {...register('special_requests')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    isSubmitting || 
                    !bookingAvailability.isAvailable || 
                    isCheckingAvailability ||
                    !selectedDate ||
                    timeSlotAvailability.isLoading
                  }
                  className={`w-full font-semibold py-4 px-6 rounded-lg transition-colors duration-300 ${
                    !bookingAvailability.isAvailable || 
                    isCheckingAvailability || 
                    !selectedDate ||
                    timeSlotAvailability.isLoading
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-900 text-white hover:bg-white hover:text-red-600'
                  } disabled:opacity-50`}
                >
                  {isCheckingAvailability || timeSlotAvailability.isLoading
                    ? 'Checking Availability...' 
                    : !bookingAvailability.isAvailable 
                    ? 'Booking Unavailable' 
                    : !selectedDate
                    ? 'Select Date First'
                    : isSubmitting 
                    ? 'Booking...' 
                    : 'Book Now'
                  }
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Booking
