const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const callhistorySchema = mongoose.Schema(
  {
   
    senderId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
      },
      recieverId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
      },
      groupId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Group',
        default: null,
       // required: true,
      },
      // roomId: {
      //   type: mongoose.SchemaTypes.ObjectId,
      //   ref: 'User',
      //   required: true,
      // },
    status: {
        type: String,
        enum: ['missed', 'success'],
        required: true,
      },
    status: {
        type: String,
        enum: ['group', 'personal'],
        required: true,
      },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    
  },
  {
    timestamps: true,
  }
);


const Callhistory = mongoose.model('Callhistory', callhistorySchema);

module.exports = Callhistory;
