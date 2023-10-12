const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const messageSchema = mongoose.Schema(
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
      conversationId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Conversation',
      //  required: true,
      },
     
    status: {
        type: String,
        enum: ['read', 'unread'],
        required: true,
      },
    
    // isDeleted: {
    //     type: Boolean,
    //    default:false
    //   },
    
    Message: {
      type: String,
      default: '',
    },
    fileType: {
      type: String,
      default: null,
    },
    file: {
     
    },
    
  },
  {
    timestamps: true,
  }
);


const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
