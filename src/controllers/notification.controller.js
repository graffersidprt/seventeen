const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService, authService, tokenService, emailService, pushNotificationService, smsService } = require('../services');
const MessageModel = require('../models/message.model');
const ConversationModel = require('../models/conversation.model');
const GroupModel = require('../models/group.model');
var multer = require('multer');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var express = require('express');
var app = express();
const path = require('path');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const { User } = require('../models');
const groupNotifications = async (req, res) => {
  try {
    const { body, user } = req;

    let { members, groupName, leftMembers } = body;
    try {
      if (members && members.length > 0) {
        await emailService.sendNewGroupNotification(members, groupName);
      }
    } catch (error) {
      console.log('error in New group', error.message);
    }

    try {
      if (leftMembers && leftMembers.length > 0) {
        await emailService.sendLeftGroupNotification(leftMembers, groupName);
      }
    } catch (error) {
      console.log('error in left group', error.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Notification Sent Successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
const blockUnblockNotifications = async (req, res) => {
  try {
    const { body } = req;

    const { userUid, block } = body;
    // let arr = members.map((item) => mongoose.Types.ObjectId(item));

    // let membersData = [];
    // if (members) {
    const user = await User.findOne({ uid: userUid }).lean();
    const parentObj = await User.findOne({ _id: mongoose.Types.ObjectId(user.parentId) }).lean();
    if (block === true && user.role =='user') {
      try {
        await emailService.sendBlockEmail(user, parentObj);
      } catch (error) {
        console.log('error in email for block', error.message);
      }
      try {
        await pushNotificationService.sendBlockUserNotification(user, parentObj);
      } catch (error) {
        console.log('error in push notification for block', error.message);
      }
    }
    if (block === false && user.role =='user') {
      try {
        
        await emailService.sendUnBlockEmail(user, parentObj);
      } catch (error) {
        console.log('error in email for unblock', error.message);
      }
      try {
        await pushNotificationService.sendUnBlockUserNotification(user, parentObj);
      } catch (error) {
        console.log('error in push notification for unblock', error.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Notification Sent Successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  groupNotifications,
  blockUnblockNotifications,
};
