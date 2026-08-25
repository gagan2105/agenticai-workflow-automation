const { v4: uuidv4 } = require('uuid');
const Notification = require('../models/Notification');
const { isUsingInMemory, getInMemoryStore } = require('../config/db');

const createNotification = async ({ owner, workflowId, executionId, type, title, message }) => {
  if (isUsingInMemory()) {
    const store = getInMemoryStore();
    const n = { id: uuidv4(), owner, workflowId, executionId, type: type || 'info', title, message, read: false, createdAt: new Date() };
    store.notifications.push(n);
    return n;
  }
  return Notification.create({ owner, workflowId, executionId, type, title, message });
};

const listNotifications = async (ownerId) => {
  if (isUsingInMemory()) {
    const store = getInMemoryStore();
    return store.notifications
      .filter((n) => n.owner === ownerId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50);
  }
  return Notification.find({ owner: ownerId }).sort({ createdAt: -1 }).limit(50).lean();
};

const markRead = async (notificationId, ownerId) => {
  if (isUsingInMemory()) {
    const store = getInMemoryStore();
    const n = store.notifications.find((n) => n.id === notificationId && n.owner === ownerId);
    if (n) n.read = true;
    return n;
  }
  return Notification.findOneAndUpdate({ _id: notificationId, owner: ownerId }, { read: true }, { new: true });
};

module.exports = { createNotification, listNotifications, markRead };
