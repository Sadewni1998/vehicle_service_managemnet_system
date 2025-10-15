// utils/validators.js

/**
 * Validates that a phone number is exactly 10 digits (numeric only).
 * @param {string} phone
 * @returns {boolean}
 */
function isTenDigitPhone(phone) {
  if (typeof phone !== "string") return false;
  const trimmed = phone.trim();
  return /^\d{10}$/.test(trimmed);
}

module.exports = {
  isTenDigitPhone,
};
