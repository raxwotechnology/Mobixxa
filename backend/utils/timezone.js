/**
 * Sri Lanka Timezone Helper (Asia/Colombo UTC+05:30)
 * Ensures attendance, shift, late marks, and payroll date boundaries
 * remain 100% accurate regardless of server/cloud environment timezone (BUG-010).
 */
const getSriLankaDateBoundaries = (inputDate = new Date()) => {
  const d = new Date(inputDate);
  
  // Format YYYY-MM-DD in Asia/Colombo
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const slDateStr = formatter.format(d); // "2026-08-21"
  
  // Start of day in SL time (00:00:00.000+05:30)
  const startOfDay = new Date(`${slDateStr}T00:00:00.000+05:30`);
  // End of day in SL time (23:59:59.999+05:30)
  const endOfDay = new Date(`${slDateStr}T23:59:59.999+05:30`);
  
  // Get Sri Lankan hour and minute
  const hourFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Colombo',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  const parts = hourFormatter.formatToParts(d);
  let hour = 0;
  let minute = 0;
  for (const part of parts) {
    if (part.type === 'hour') hour = parseInt(part.value, 10);
    if (part.type === 'minute') minute = parseInt(part.value, 10);
  }
  
  return {
    slDateStr,
    startOfDay,
    endOfDay,
    hour: hour === 24 ? 0 : hour,
    minute,
  };
};

module.exports = { getSriLankaDateBoundaries };
