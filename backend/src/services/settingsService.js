const Settings = require('../models/Settings');
const logger = require('../utils/logger');

let cachedSettings = null;
let cacheTime = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getSettings = async () => {
  const now = Date.now();
  if (cachedSettings && cacheTime && now - cacheTime < CACHE_TTL) {
    return cachedSettings;
  }

  let settings = await Settings.findOne({ key: 'global' });
  if (!settings) {
    settings = await Settings.create({ key: 'global' });
    logger.info('Created default settings');
  }

  cachedSettings = settings;
  cacheTime = now;
  return settings;
};

const invalidateCache = () => {
  cachedSettings = null;
  cacheTime = null;
};

const getLoanDays = async (role) => {
  const settings = await getSettings();
  const map = {
    student: settings.borrowing.studentLoanDays,
    staff: settings.borrowing.staffLoanDays,
    librarian: settings.borrowing.librarianLoanDays,
    admin: settings.borrowing.librarianLoanDays,
  };
  return map[role] || settings.borrowing.studentLoanDays;
};

const getMaxBooks = async (role) => {
  const settings = await getSettings();
  const map = {
    student: settings.borrowing.studentMaxBooks,
    staff: settings.borrowing.staffMaxBooks,
    librarian: settings.borrowing.librarianMaxBooks,
    admin: settings.borrowing.librarianMaxBooks,
  };
  return map[role] || settings.borrowing.studentMaxBooks;
};

const calculateFine = async (overdueDays) => {
  const settings = await getSettings();
  const { finePerDay, gracePeriodDays, maxFineAmount } = settings.fines;
  const chargeableDays = Math.max(0, overdueDays - gracePeriodDays);
  const fine = Math.min(chargeableDays * finePerDay, maxFineAmount);
  return { fine, chargeableDays, finePerDay, gracePeriodDays, maxFineAmount };
};

module.exports = { getSettings, invalidateCache, getLoanDays, getMaxBooks, calculateFine };
