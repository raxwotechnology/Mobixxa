// Shared Sri Lankan mobile number helpers (mirrors backend/utils/validators.js)
// Accepts input as: +94771234567, 94771234567, 0771234567, 771234567
// Canonical format: +947XXXXXXXX

export const formatSLPhone = (phone) => {
  if (!phone) return '';
  const cleaned = String(phone).replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+94')) return cleaned;
  if (cleaned.startsWith('94')) return '+' + cleaned;
  if (cleaned.startsWith('0')) return '+94' + cleaned.slice(1);
  if (cleaned.length === 9) return '+94' + cleaned;
  return cleaned;
};

export const isValidSLPhone = (phone) => /^\+947\d{8}$/.test(formatSLPhone(phone));
