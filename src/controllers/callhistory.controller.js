const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const config = require('../config/config');
const { userService } = require('../services');
const MessageModel = require('../models/message.model');
const CallhistoryModel = require('../models/callhistory.model');
var multer = require('multer');
var bodyParser = require('body-parser');
var express = require('express');
var moment = require('moment');
var app = express();
const path = require('path');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var request = require('request');
const { User } = require('../models');
const createCallhistory = async (req, res) => {
  try {
    const { body, user } = req;
    const { senderId, recieverId, status, startedAt, endedAt } = body;

    const data = {
      senderId,
      recieverId,
      status,
      type,
      startedAt,
      endedAt,
    };
    const result = await CallhistoryModel.create(data);
    //   const messageData = new Message(data);
    //   const result = await messageData.save();

    return res.status(200).json({
      success: true,
      message: 'Callhistory Added Successfully',
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

const getCalhistoryList = async (req, res, next) => {
  try {
    const { query, user } = req;
    const { userUid } = query;
    // const limit = query.limit ? parseInt(query.limit, 10) : 10;
    // const page = query.page ? parseInt(query.page, 10) : 1;
    // const skip = (page - 1) * limit;
   
    const options = {
      method: 'GET',
      url: `https://${config.cometchat.appid}.api-${config.cometchat.appcountry}.cometchat.io/v3/messages?category=call&limit=10&withTags=false&hideDeleted=true`,
      headers: {
        apiKey: config.cometchat.restapikey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // onBehalfOf: '632170cd81f498d90910759d',
        onBehalfOf: userUid,
        //user._id
      },
      // url: 'https://22117995fd3a98b0.api-us.cometchat.io/v3/messages?category=call&limit=10&withTags=false&hideDeleted=true',
      // headers: {
      //   apiKey: '0703d8b39ddcee5646f7c0fb5421f6f9a9343529',
      //   'Content-Type': 'application/json',
      //   Accept: 'application/json',
      //   // onBehalfOf: '632170cd81f498d90910759d',
      //   onBehalfOf: userUid,
      //   //user._id
      // },
      json: true,
    };

    // let momemn = moment.unix(1663136594).format('DD:MM:YYYY:HH:MM')
    // console.log("momemn",momemn);
    request(options, async function (error, response, body) {
      // if (error) throw new Error(error);
      // console.log('22222222222222',error);
      //  console.log('888888888888888',body);

      if (error) {
        return res.status(400).json({
          success: false,
          message: 'something went wrong',
        });
      }
      if (body) {
        let arr = [];
        if (body && body.data.length > 0) {
        
          for (let iterator of body.data) {
            if (
              iterator.data.action === 'ended' ||  
              iterator.data.action === 'unanswered' ||
              iterator.data.action === 'busy' || 
              iterator.data.action === 'rejected' || 
              iterator.data.action === 'cancelled' 
            ) {
              let senderImagePath = '';
              let senderMongoId = '';
              let receiverrMongoId = '';
              let receiverImagePath = '';  

            
              const reciverData = await User.findOne({ uid: iterator.receiver }, { _id: 1, user_image_path: 1 }).lean();
              receiverrMongoId = reciverData._id;
             
              if (reciverData.user_image_path) {
                receiverImagePath = reciverData.user_image_path;
              }

              const senderData = await User.findOne({ uid: iterator.sender }, { _id: 1, user_image_path: 1 }).lean();
              senderMongoId = senderData._id;
              // senderImagePath = senderData.user_image_path;
              if (senderData.user_image_path) {
                senderImagePath = senderData.user_image_path;
              }

              await arr.push({
                ...iterator.data.entities['on'].entity,
                messageid: iterator.id,
                receiverrMongoId,
                senderImagePath,
                senderMongoId,
                receiverImagePath,
                conversationId: iterator.conversationId,
              });
            }
          }
        }
        return res.status(200).json({
          success: true,
          // dataaaaa: body.data,
          data: arr,
          message: 'Call log list Fetched Successfully',
        });
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'error',
      error: error.message,
    });
  }
};
const deleteCallhistory = async (req, res, next) => {
  try {
    const { query, user } = req;
    const { userUid, messageid } = query;
    // const limit = query.limit ? parseInt(query.limit, 10) : 10;
    // const page = query.page ? parseInt(query.page, 10) : 1;
    // const skip = (page - 1) * limit;

    const request = require('request');

    const options = {
      method: 'DELETE',
      url: `https://${config.cometchat.appid}.api-${config.cometchat.appcountry}.cometchat.io/v3/messages/${messageid}`,
      headers: {
        apiKey: config.cometchat.restapikey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      // onBehalfOf: userUid,
      },
      // url: `https://21776659a48d484e.api-us.cometchat.io/v3/messages/${messageid}`,
      // headers: {
      //   apiKey: 'cf528c16e7ca712d85627e87399e952aca0c6660',
      //   'Content-Type': 'application/json',
      //   Accept: 'application/json',
      // // onBehalfOf: userUid,
      // },
      body: { permanent: false },
      json: true,
    };
  
    request(options, async function (error, response, body) {
      if (error) {
        return res.status(400).json({
          success: false,
          error,
          message: 'something went wrong',
        });
      }
      if (body.error) {
       console.log(body.error);
        return res.status(400).json({
          success: false,
          body,
          message: 'Something went wrong',
        });
      }
      if (body.data) {
        console.log("data",body.data);
        return res.status(200).json({
          success: true,
          body,
          message: 'Call log Deleted Successfully',
        });
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'error',
      error: error.message,
    });
  }
};

// const getCalhistoryList = async (req, res, next) => {
//   try {
//     const { query, user } = req;
//     //  const { search, gender, status } = query;
//     const limit = query.limit ? parseInt(query.limit, 10) : 10;
//     const page = query.page ? parseInt(query.page, 10) : 1;
//     const skip = (page - 1) * limit;
//      const data = await CallhistoryModel.find().skip(skip).limit(limit);
//     // const data = await CallhistoryModel.aggregate([
//     //   {
//     //     $facet: {
//     //       senderData: [
//     //         {
//     //           $match: { senderId: { $in: [mongoose.Types.ObjectId(user._id)] } },
//     //         },
//     //         {
//     //           $addFields: {
//     //             sender: true,
//     //           },
//     //         },
//     //       ],
//     //       recieverData: [
//     //         {
//     //           $match: { recieverId: { $in: [mongoose.Types.ObjectId(user._id)] } },
//     //         },
//     //         { $addFields: { sender: false } },
//     //         {
//     //           $lookup: {
//     //             from: 'users',
//     //             localField: 'recieverId',
//     //             foreignField: '_id',
//     //             as: 'userData',
//     //           },
//     //         },
//     //         //  { $unwind: '$groupData' },
//     //         //  { $sort: { updatedAt: 1 } },
//     //       ],
//     //     },
//     //   },

//     //   {
//     //     $project: {
//     //       concatArr: {
//     //         $concatArrays: ['$senderData', '$recieverData'],
//     //       },
//     //     },
//     //   },
//     //   { $unwind: { path: '$concatArr', preserveNullAndEmptyArrays: true } },
//     //   { $replaceRoot: { newRoot: '$concatArr' } },
//     //   { $sort: { _id: 1 } },
//     //   { $skip: skip },
//     //   { $limit: limit },
//     // ]);
//     return res.status(200).json({
//       success: true,
//       message: 'Call history list fetch successfully',
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
const getCallhistoryView = async (req, res) => {
  try {
    const { params } = req;
    const { id } = params;
    //  const { search, gender, status } = query;

    const data = await CallhistoryModel.findOne({ _id: mongoose.Types.ObjectId(id) });
    return res.status(200).json({
      success: true,
      message: 'Call history view fetched successfully',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
// const deleteCallhistory = async (req, res) => {
//   try {
//     const { params } = req;
//     const { id } = params;
//     //  const { search, gender, status } = query;

//     const data = await CallhistoryModel.deleteOne({ _id: mongoose.Types.ObjectId(id) });
//     return res.status(200).json({
//       success: true,
//       message: 'Call history deleted successfully',
//       data,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// };
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
  createCallhistory,
  getCalhistoryList,
  getCallhistoryView,
  getUsers,
  deleteCallhistory,
  getUser,
};
