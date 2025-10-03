import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Plus, Trash2, Car } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [vehicles, setVehicles] = useState([{ id: 1 }])
  const { register, handleSubmit, formState: { errors }, watch } = useForm()
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()

  const password = watch('password')

  const addVehicle = () => {
    setVehicles([...vehicles, { id: Date.now() }])
  }

  const removeVehicle = (id) => {
    if (vehicles.length > 1) {
      setVehicles(vehicles.filter(vehicle => vehicle.id !== id))
    }
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    
    try {
      // Transform form data to match backend expectations
      const registrationData = {
        name: data.username,
        email: data.email,
        password: data.password,
        phone: data.contact_number,
        address: data.address,
        vehicles: []
      }

      // Process vehicle data if provided
      if (data.vehicle_number && Array.isArray(data.vehicle_number)) {
        data.vehicle_number.forEach((vehicleNumber, index) => {
          if (vehicleNumber) { // Only add if vehicle number is provided
            registrationData.vehicles.push({
              vehicleNumber: vehicleNumber,
              brand: data.vehicle_brand?.[index] || '',
              model: data.vehicle_model?.[index] || '',
              type: data.vehicle_type?.[index] || '',
              manufactureYear: data.manufacture_year?.[index] || null,
              fuelType: data.fuel_type?.[index] || '',
              transmission: data.transmission?.[index] || ''
            })
          }
        })
      }

      const result = await registerUser(registrationData)
      if (result.success) {
        navigate('/')
      }
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-3 mb-4">
            <img src="/logo.png" alt="GearGuard" className="w-24 h-12" />
            <h1 className="text-3xl font-bold text-primary-600">GearUp Auto Care</h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in here
            </Link>
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)} className="p-8">
            {/* Personal Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Car className="w-5 h-5 mr-2 text-primary-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Name with Initials
                  </label>
                  <input
                    type="text"
                    id="username"
                    className="input-field mt-1"
                    {...register('username', { required: 'name with initials is required' })}
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="input-field mt-1"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    id="contact_number"
                    className="input-field mt-1"
                    {...register('contact_number', {
                      required: 'Contact number is required',
                      pattern: {
                        value: /^[0-9+\-\s()]+$/,
                        message: 'Invalid contact number'
                      }
                    })}
                  />
                  {errors.contact_number && (
                    <p className="mt-1 text-sm text-red-600">{errors.contact_number.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <textarea
                    id="address"
                    rows={3}
                    className="input-field mt-1"
                    {...register('address', { required: 'Address is required' })}
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      className="input-field pr-10"
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters'
                        }
                      })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirm_password"
                      className="input-field pr-10"
                      {...register('confirm_password', {
                        required: 'Please confirm your password',
                        validate: value => value === password || 'Passwords do not match'
                      })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirm_password && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirm_password.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Car className="w-5 h-5 mr-2 text-primary-600" />
                  Vehicle Information
                </h3>
                <button
                  type="button"
                  onClick={addVehicle}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Vehicle</span>
                </button>
              </div>

              {vehicles.map((vehicle, index) => (
                <div key={vehicle.id} className="border border-gray-200 rounded-lg p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Vehicle {index + 1}</h4>
                    {vehicles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVehicle(vehicle.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="col-span-full">
                      <label className="block text-sm font-medium text-gray-700">Vehicle Number</label>
                      <input
                        type="text"
                        className="input-field mt-1"
                        {...register(`vehicle_number.${index}`)}
                      />
                    </div>

                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Brand</label>
                      <select
                        className="input-field mt-2"
                        defaultValue=""
                        {...register(`vehicle_brand.${index}`)}
                      >
                        <option value="" disabled hidden>Select Brand</option>
                        <option value="toyota">Toyota</option>
                        <option value="honda">Honda</option>
                        <option value="suzuki">Suzuki</option>
                        <option value="ford">Ford</option>
                        <option value="mazda">Mazda</option>
                        <option value="isuzu">Isuzu</option>
                        <option value="subaru">Subaru</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Model</label>
                      <input
                        type="text"
                        className="input-field mt-2"
                        {...register(`vehicle_model.${index}`)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <select
                        className="input-field mt-2"
                        defaultValue=""
                        {...register(`vehicle_type.${index}`)}
                      >
                        <option value="" disabled hidden>Select Type</option>
                        <option value="wagon">Wagon</option>
                        <option value="sedan">Sedan</option>
                        <option value="suv">SUV</option>
                        <option value="hatchback">Hatchback</option>
                        <option value="doublecab">Pickup/ Double Cab</option>
                        <option value="jeep">Jeep/ Crosssover</option>
                        <option value="minicar">Mini Car/ Kei Car</option>
                        <option value="van">Van</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Manufacture Year</label>
                      <input
                        type="number"
                        min="1990"
                        max="2024"
                        className="input-field mt-2"
                        {...register(`manufacture_year.${index}`)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Fuel Type</label>
                      <select
                        className="input-field mt-2"
                        defaultValue=""
                        {...register(`fuel_type.${index}`)}
                      >
                        <option value="" disabled hidden>Select Fuel Type</option>
                        <option value="petrol">Petrol</option>
                        <option value="diesel">Diesel</option>
                        <option value="electric">Electric</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Transmission</label>
                      <select
                        className="input-field mt-2"
                        defaultValue=""
                        {...register(`transmission.${index}`)}
                      >
                        <option value="" disabled hidden>Select Transmission</option>
                        <option value="auto">Automatic</option>
                        <option value="manual">Manual</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register
