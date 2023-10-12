const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const groupSchema = mongoose.Schema(
  {
    members: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    admins: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    creater: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      default: null,
    },
    group_image_path:{
      type: String 
    },
    
    // roomId: {
    //   type: mongoose.SchemaTypes.ObjectId,
    //   ref: 'User',
    //   required: true,
    // },
    // status: {
    //   type: String,
    // },
    roomId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Group = mongoose.model('group', groupSchema);

module.exports = Group;
