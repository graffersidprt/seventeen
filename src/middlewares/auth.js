const passport = require('passport');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { roleRights } = require('../config/roles');
const { User } = require('../models');
const mongoose = require('mongoose');

const verifyCallback = (req, resolve, reject, requiredRights) => async (err, user, info) => {
  if (err || info || !user) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
  }
  req.user = user;
  req.parentDeatils = {};
  if (user.role === 'user') {
    parentDeatils = await User.findOne({ _id: mongoose.Types.ObjectId(user.parentId) }).lean();
    req.user = user;
    req.parentDeatils = parentDeatils;
  }

  if (requiredRights.length) {
    const userRights = roleRights.get(user.role);

    const hasRequiredRights = requiredRights.every((requiredRight) => userRights.includes(requiredRight));
    if (!hasRequiredRights) {
      //&& req.params.userId !== user._id
      return reject(new ApiError(httpStatus.FORBIDDEN, 'You are not Authorized'));
    }
  }

  resolve();
};

const auth =
  (...requiredRights) =>
  async (req, res, next) => {
    return new Promise((resolve, reject) => {
      passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, requiredRights))(req, res, next);
    })
      .then(() => next())
      .catch((err) => next(err));
  };

module.exports = auth;
