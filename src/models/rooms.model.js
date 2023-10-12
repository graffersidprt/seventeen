const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const roomSchema = mongoose.Schema(
  {
    senderId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    reciverId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    roomId: {
      type: String,
      default: null,
      required: true,
    },
    // type: {
    //     type: String,
    //     enum: ['personal', 'group'],
    //     required: true,
    //   },
  },
  {
    timestamps: true,
  }
);

const Rooms = mongoose.model('Rooms', roomSchema);

module.exports = Rooms;
