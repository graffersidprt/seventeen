const Joi = require('joi');
const { password, objectId } = require('./custom.validation');


const createUser = {
  body: Joi.object().keys({
    phone: Joi.string().pattern(/^[0-9]+$/).required(),
    phoneCountryCode: Joi.string(),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getUser = {
  body: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const uploadPic = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      dob: Joi.string(),
      email:Joi.string().required(),
      name: Joi.string().required(),
      parent_name: Joi.string(),
      parent_number: Joi.string(),
      parentPhoneCountryCode: Joi.string(),
      gender:Joi.string(),
      parent_username:Joi.string(),
    })
    .min(1),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const getChilds = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const geUserName = {
  body: Joi.object().keys({
    parent_name: Joi.string().required(),
    parent_number: Joi.string().required(),
  }),
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getChilds,
  uploadPic,
  geUserName,
};
