const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const onlineUserSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
     // required: true,
    },
   
    socketId: {
      type: String,
      default: null,
      required: true,
    },
    // userId: {
    //   type: String,
    //   default: null,
    //   required: true,
    // },
  },
  {
    timestamps: true,
  }
);

const onlineUser = mongoose.model('onlineusers', onlineUserSchema);

module.exports = onlineUser;
