const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const MessageModel = require('../models/message.model');
var multer = require('multer');
var bodyParser = require('body-parser');
var express = require('express');
var mongoose = require('mongoose');
var app = express();
const path = require('path');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const createMessage = async (req, res) => {
  try {
    const { body, user } = req;
    const { senderId, recieverId, conversationId, status, Message, file, fileType } = body;

    const data = {
      senderId,
      recieverId,
      conversationId,
      status,
      Message,
      file,
      fileType,
    };
    const result = await MessageModel.create(data);
    //   const messageData = new Message(data);
    //   const result = await messageData.save();

    return res.status(200).json({
      success: true,
      message: 'Message Added Successfully',
      data: result,
    });
  } catch (error) {
    console.log('354635645', error.message);
    return res.status(500).json({
      success: false,

      error: error.message,
    });
  }
};
const updateMessageStatus = async (req, res) => {
  try {
    const { body, user, params } = req;
    const { status } = body;

    const { id } = params;

    const data = await MessageModel.updateOne(
      { _id: id },
      {
        $set: {
          status,
        },
      },
      { runValidators: true } // For run enum mongoose validation.
    );
    //   const messageData = new Message(data);
    //   const result = await messageData.save();

    return res.status(200).json({
      success: true,
      message: 'Message Status Updated Successfully',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
const getUnreadMessage = async (req, res) => {
  try {
    const { query, user } = req;
    const { status } = body;

    const { id } = query;

    const data = await MessageModel.find({ _id: id, status: 'unread' });
    //   const messageData = new Message(data);
    //   const result = await messageData.save();

    return res.status(200).json({
      success: true,
      message: 'Message Status Updated Successfully',
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getMessageList = async (req, res, next) => {
  try {
    const { query } = req;
    //  const { search, gender, status } = query;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;
    const page = query.page ? parseInt(query.page, 10) : 1;
    const skip = (page - 1) * limit;
    const data = await MessageModel.find().skip(skip).limit(limit);
    return res.status(200).json({
      success: true,
      message: 'Message list fetch successfully',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'error',
      error: error.message,
    });
  }
};
// const deleteMessage = async (req, res, next) => {
//   try {
//     const { params } = req;
//     const { id } = params;
//     //  const { search, gender, status } = query;

//     const data = await MessageModel.updateOne({_id:mongoose.Types.ObjectId(id)},{$set:{isDeleted:true}})
//     return res.status(200).json({
//       success: true,
//       message: 'Message deleted successfully',
//       data,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: 'error',
//       error: error.message,
//     });
//   }
// };

const getMessageListByConversation = async (req, res, next) => {
  try {
    const { query, params } = req;
    const { conversationId } = params;
    //  const { search, gender, status } = query;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;
    const page = query.page ? parseInt(query.page, 10) : 1;
    const skip = (page - 1) * limit;
    // const data = await MessageModel.find({conversationId:mongoose.Types.ObjectId(conversationId)}).skip(skip).limit(limit);
    const data = await MessageModel.aggregate([
      {
        $match: { conversationId: mongoose.Types.ObjectId(conversationId) },
      },

      {
        $lookup: {
          from: 'users',
          localField: 'senderId',
          foreignField: '_id',
          as: 'sendersData',
        },
      },
      { $unwind: { path: '$sendersData', preserveNullAndEmptyArrays: true } },

      { $sort: { _id: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);
    return res.status(200).json({
      success: true,
      message: 'Message list fetch successfully',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'error',
      error: error.message,
    });
  }
};
const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

module.exports = {
  createMessage,
  getMessageList,
  getUnreadMessage,
  getMessageListByConversation,
  getUsers,
  // deleteMessage,
  updateMessageStatus,
  getUser,
};
