const Joi = require('joi');
const { password } = require('./custom.validation');

const register = {
  
  body: Joi.object().keys({
    phone: Joi.string().pattern(/^[0-9]+$/).required(),
    email: Joi.string().email().required(),
    phoneCountryCode: Joi.string(),
    FCMToken: Joi.string(),
  }),
};


const login = {
  body: Joi.object().keys({
    phone: Joi.string().pattern(/^[0-9]+$/).required(),
    email: Joi.string().email().required(),
    FCMToken:Joi.string(),
    phoneCountryCode:Joi.string(),
  }),
};



const verifyotp={
  body: Joi.object().keys({
    otp: Joi.string().length(4).required(),
    hash: Joi.string().required(),
    phoneCountryCode:Joi.string(),
    phone: Joi.string().pattern(/^[0-9]+$/).required(),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const resetPassword = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};

const verifyEmail = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail,
  verifyotp,
};
