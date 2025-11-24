import { useRef, useState } from "react";
import toast from "react-hot-toast";

const INPUT_LENGTH = 5;

const Validation = () => {
  const [digits, setDigits] = useState(Array(INPUT_LENGTH).fill(""));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef([]);

  const updateDigits = (nextDigits) => {
    setDigits([...nextDigits]);
  };

  const focusInput = (index) => {
    if (inputRefs.current[index]) {
      inputRefs.current[index].focus();
      inputRefs.current[index].select();
    }
  };

  const handleChange = (event, index) => {
    const value = event.target.value.replace(/\D/g, "");
    if (!value) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      updateDigits(nextDigits);
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = value[value.length - 1];
    updateDigits(nextDigits);

    if (index < INPUT_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (event, index) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      focusInput(index - 1);
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
    }
    if (event.key === "ArrowRight" && index < INPUT_LENGTH - 1) {
      event.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, INPUT_LENGTH)
      .split("");

    if (!pasted.length) return;

    const nextDigits = Array(INPUT_LENGTH)
      .fill("")
      .map((_, index) => pasted[index] || "");

    updateDigits(nextDigits);
    const lastFilledIndex = Math.min(pasted.length, INPUT_LENGTH) - 1;
    focusInput(lastFilledIndex);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (digits.some((digit) => !digit)) {
      toast.error("Please enter all five numbers.");
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`Submitted code: ${digits.join("")}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center pb-24 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Hybrid Lanka" className="w-24.5 h-12" />
            <h2 className="text-4xl font-bold text-primary-600">Hybrid Lanka</h2>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Enter Validation Code
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please type the five-digit code sent to your email.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex justify-between gap-3" onPaste={handlePaste}>
              {digits.map((value, index) => (
                <input
                  key={`digit-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  className="w-16 h-16 text-center text-2xl font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={value}
                  onChange={(event) => handleChange(event, index)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                  ref={(element) => (inputRefs.current[index] = element)}
                  aria-label={`Digit ${index + 1}`}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Code"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Validation;


