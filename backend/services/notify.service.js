const Notification = require('../models/Notification');

// Small helper so controllers can generate a Notification in one line
// without duplicating the create-call boilerplate. Fire-and-forget: a
// notification failure must never break the primary request.
async function notify({ user, type, message, relatedStudent = null }) {
  if (!user) return null;
  try {
    return await Notification.create({ user, type, message, relatedStudent });
  } catch (err) {
    console.error('[NOTIFY] Failed to create notification:', err.message); // eslint-disable-line no-console
    return null;
  }
}

module.exports = { notify };
