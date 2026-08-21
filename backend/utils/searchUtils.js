/**
 * Safely escape special regular expression characters in user search input.
 * Prevents MongoDB regex parsing errors and regex injection (BUG-009).
 */
const escapeRegex = (text = '') => {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = { escapeRegex };
