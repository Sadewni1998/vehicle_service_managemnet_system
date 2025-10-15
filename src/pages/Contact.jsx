import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { contactAPI } from "../utils/api";
import { unicodeNameRegex, sanitizeNameInput } from "../utils/validators";

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await contactAPI.submit(data);
      toast.success("Message sent successfully!");
      reset();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to send message. Please try again.";
      toast.error(message);
      console.error("Contact error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      title: "Booking",
      email: "book@hybridlanka.com",
    },
    {
      title: "General",
      email: "info@hybridlanka.com",
    },
    {
      title: "Technical",
      email: "tech@hybridlanka.com",
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div
        className="relative h-64 bg-cover bg-center"
        style={{ backgroundImage: "url(/img/carousel-bg-1.jpg)" }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">Contact</h1>
            <nav className="text-sm">
              <span>Home</span> / <span>Pages</span> /{" "}
              <span className="text-primary-400">Contact</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold">Contact For Any Query</h1>
          </div>

          {/* Contact Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className="bg-gray-50 p-6 rounded-lg text-center"
              >
                <h5 className="text-lg font-semibold mb-3">{info.title}</h5>
                <p className="flex items-center justify-center text-gray-600">
                  <span className="mr-2">✉️</span>
                  {info.email}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Map */}
            <div className="h-96">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3765.7573900489488!2d79.93758117475585!3d6.7962219932010886!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae24feaed0a1911%3A0x4928c5b0ae88ce65!2sHybrid%20Lanka!5e1!3m2!1sen!2slk!4v1759487870052!5m2!1sen!2slk"
                className="w-full h-full rounded-lg border-0"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            {/* Contact Form */}
            <div>
              <p className="text-gray-600 mb-6 text-lg">
                Welcome to Hybrid Lanka! Whether you have questions, need
                advice, or want to learn more about our services, we're here to
                help. Please fill out the form below, and our dedicated team
                will get back to you as soon as possible. We look forward to
                assisting you with all your automotive needs!
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <input
                      type="text"
                      placeholder="Your Name"
                      className="input-field"
                      inputMode="text"
                      aria-label="Name with Initials"
                      title="Letters only. Allowed separators: space, hyphen (-), apostrophe ('), and period (.)"
                      onChange={(e) => {
                        // Sanitize as the user types to allow only letters and common name separators
                        const sanitized = sanitizeNameInput(e.target.value);
                        if (sanitized !== e.target.value) {
                          e.target.value = sanitized;
                        }
                      }}
                      {...register("name", {
                        required: "Name is required",
                        validate: (v) =>
                          unicodeNameRegex.test(v || "") ||
                          "Use letters only; separators allowed: space, hyphen (-), apostrophe ('), period (.)",
                      })}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      title="Enter a valid email, e.g., name@example.com"
                      className="input-field"
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address",
                        },
                      })}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Subject"
                    className="input-field"
                    {...register("subject", {
                      required: "Subject is required",
                    })}
                  />
                  {errors.subject && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.subject.message}
                    </p>
                  )}
                </div>

                <div>
                  <textarea
                    placeholder="Leave a message here"
                    rows={6}
                    className="input-field resize-none"
                    {...register("message", {
                      required: "Message is required",
                    })}
                  />
                  {errors.message && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
