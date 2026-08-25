const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const User = require('../models/User');
const { isUsingInMemory, getInMemoryStore } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const signToken = (userId) =>
  jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const register = async ({ name, email, password, role }) => {
  if (isUsingInMemory()) {
    const store = getInMemoryStore();
    if (store.users.find((u) => u.email === email)) {
      const err = new Error('Email already registered');
      err.statusCode = 409;
      throw err;
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = { id: uuidv4(), name, email, password: hashedPassword, role: role || 'operator', createdAt: new Date() };
    store.users.push(user);
    const token = signToken(user.id);
    return { token, user: { id: user.id, name, email, role: user.role } };
  }

  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }
  const user = await User.create({ name, email, password, role: role || 'operator' });
  const token = signToken(user._id);
  return { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } };
};

const login = async ({ email, password }) => {
  if (isUsingInMemory()) {
    const store = getInMemoryStore();
    const user = store.users.find((u) => u.email === email);
    if (!user) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }
    user.lastLogin = new Date();
    const token = signToken(user.id);
    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }
  const match = await user.comparePassword(password);
  if (!match) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }
  user.lastLogin = new Date();
  await user.save();
  const token = signToken(user._id);
  return { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } };
};

const getMe = async (userId) => {
  if (isUsingInMemory()) {
    const store = getInMemoryStore();
    const user = store.users.find((u) => u.id === userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return { id: user._id, name: user.name, email: user.email, role: user.role, lastLogin: user.lastLogin };
};

module.exports = { register, login, getMe };
