const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const conversationSchema = mongoose.Schema(
  {
   
    members: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User'
      }],
      groupId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Group',
        default: null,
      },
      cometchatConversationId: {
        type: String,
        required: true,
      },
    type: {
        type: String,
        enum: ['group', 'personal'],
        required: true,
      },
    // Message: {
    //   type: String,
    //   default: '',
    // },
    
  },
  {
    timestamps: true,
  }
);


const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
