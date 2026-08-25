const notificationService = require('../services/notificationService');

const list = async (req, res, next) => {
  try {
    const notifications = await notificationService.listNotifications(req.user.id);
    res.json({ success: true, notifications });
  } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markRead(req.params.id, req.user.id);
    res.json({ success: true, notification });
  } catch (err) { next(err); }
};

module.exports = { list, markRead };
