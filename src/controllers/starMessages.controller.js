const httpStatus = require('http-status');
const pick = require('../utils/pick');
const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const GroupModel = require('../models/group.model');
const StartMessageModel = require('../models/startmessage.model');
const UserModel = require('../models/user.model');
var multer = require('multer');
var bodyParser = require('body-parser');
var express = require('express');
var app = express();
const path = require('path');
const { Conversation } = require('../models');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const createStarMessage = async (req, res) => {
  try {
    const { body, user } = req;
    const { arr } = body;

    let data = {
      messageId,
      star,
    };

    //  const result = await StartMessageModel.create(data);
    const result = await StartMessageModel.insertMany(arr);
   
    return res.status(200).json({
      success: true,
      message: 'Star Message Added Successfully',
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getStarMessageView = async (req, res) => {
  try {
    const { params } = req;
    const { id } = params;
    //  const { search, gender, status } = query;
    let data = await StartMessageModel.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(id) },
      },
      {
        $lookup: {
          from: 'messages',
          localField: 'messageId',
          foreignField: '_id',
          as: 'messagesData',
        },
      },
      { $unwind: '$messagesData' },
    ]);

    return res.status(200).json({
      success: true,
      message: 'Star Message view fetched successfully',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
const getStarMessageList = async (req, res) => {
  try {
    const { params, user } = req;

    //  const { search, gender, status } = query;
    let data = await StartMessageModel.aggregate([
      {
        $match: { userId: mongoose.Types.ObjectId(user._id) },
      },
      {
        $lookup: {
          from: 'messages',
          localField: 'messageId',
          foreignField: '_id',
          as: 'messagesData',
        },
      },
      { $unwind: '$messagesData' },
    ]);

    return res.status(200).json({
      success: true,
      message: 'Star Message view fetched successfully',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
const startMessageDelete = async (req, res) => {
  try {
    const { params } = req;
    const { id } = params;
    //  const { search, gender, status } = query;

    const data = await StartMessageModel.deleteOne({ _id: mongoose.Types.ObjectId(id) });

    return res.status(200).json({
      success: true,
      message: 'Star Message deleted successfully',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  startMessageDelete,
  getStarMessageList,
  createStarMessage,
  getStarMessageView,
};
