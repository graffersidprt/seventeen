const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const starMessageSchema = mongoose.Schema(
  {
    messageId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Message',
      required: true,
    },
    userId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    star: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const starMessage = mongoose.model('StarMessage', starMessageSchema);

module.exports = starMessage;
