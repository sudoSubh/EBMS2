const Settings = require('../models/Settings');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { invalidateCache } = require('../services/settingsService');

/**
 * GET /api/settings
 */
const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne({ key: 'global' });
  if (!settings) {
    settings = await Settings.create({ key: 'global' });
  }
  return ApiResponse.success(res, settings);
});

/**
 * PUT /api/settings
 */
const updateSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne({ key: 'global' });
  if (!settings) {
    settings = new Settings({ key: 'global' });
  }

  // Deep merge update
  const merge = (target, source) => {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        merge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  };

  merge(settings, req.body);
  settings.markModified('borrowing');
  settings.markModified('fines');
  settings.markModified('reservations');
  settings.markModified('notifications');
  settings.markModified('library');

  await settings.save();
  invalidateCache();

  return ApiResponse.success(res, settings, 'Settings updated successfully');
});

module.exports = { getSettings, updateSettings };
