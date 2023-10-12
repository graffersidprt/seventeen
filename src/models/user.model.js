const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      index:true,
      trim: true,
    },
    email: {
      type: String,
     // required: true,
      trim: true,
      default: '',
    },
    uid: {
      type: String,
      default: '',
      index:true
     // required: true,
    
    },
    role: {
      type: String,
      enum: roles,
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isParentVerified: {
      type: Boolean,
      default: false,
    },
    profileComplete: {
      type: Boolean,
      default: false,
    },
    otpCount: {
      type: Number,
      default:0,
      index:true,
      required: false,
    
    },
    otpDate: {
      type: Date,
      index:true,
     // default: Date.now
  },
    isOnline: {
      type: Boolean,
      default: false,
    },
    parent_name: {
      type: String,
      required: false,
      trim: true,
    },
    parent_number: {
      type: String,
      required: false,
      trim: true,
    },
  //   otpCount: {
  //     type: Number,
  //     default:0,
  //     required: false,
    
  //   },
  //   otpDate: {
  //     type: Date,
  //    // default: Date.now
  // },
    parent_username: {
      type: String,
      required: false,
      trim: true,
    },
    gender: {
      type: String,
      required: false,
      enum: ['Male','Female','Other'],
    },
    dob: {
      type: Date,
      required: false,
    },
    user_image_path: {
      type: String,
      required: false,
      default: '',
    },
    cometchatStatusMessage: {
      type: String,
      required: false,
      default: '',
    },
    phoneCountryCode: {
      type: String,
      required: true,
      default: '',
    },
    parentPhoneCountryCode: {
      type: String,
      default: '',
    },
    cometchatAuthtoken: {
      type: String,
      default: '',
    },
    blockedByUsers: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        default: null,
      },
    ],
    parentId: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      default: null,
    },
    FCMToken: {
      type: String,
      default: '',
    }
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if phone is taken
 * @param {string} phone - The user's phone
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isPhoneTaken = async function (phone, excludeUserId) {
  const user = await this.findOne({ phone, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
/*userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});*/

/**
 * @typedef User
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
