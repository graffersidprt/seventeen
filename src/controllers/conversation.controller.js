const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService, authService, tokenService, emailService, smsService, pushNotificationService } = require('../services');
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
const createConversation = async (req, res) => {
  try {
    const { body, user } = req;
    const { type, groupId, cometchatConversationId } = body;
    let { members } = body;
    // let arr = members.map((item) => mongoose.Types.ObjectId(item));
    let data = {
      //  members,
      groupId,
      cometchatConversationId,
      type,
    };

    let membersData = [];
    if (members) {
      const memberId = await User.find({ uid: { $in: members } }, { _id: 1 }).lean();

      if (memberId) {
        for (const iterator of memberId) {
          membersData.push(iterator._id);
        }
      }

      // members.map(function (item) {
      //   const memberId =  User.findOne({uid:item},{_id:1}).lean();
      //   membersData.push(memberId._id)
      //   var isValid = mongoose.Types.ObjectId.isValid(item);
      //   if (!isValid) {
      //     return res.status(500).json({
      //       success: false,
      //       error: 'Something went wrong in create conversation',
      //     });
      //   }
      // });
    }
    let arr = membersData.map((item) => mongoose.Types.ObjectId(item));
    if (membersData && membersData.length > 0) {
      data.members = arr;
    }

    const isExist = await ConversationModel.findOne({ $and: [{ members: { $all: arr }, type }] }).lean();
    if (isExist) {
      return res.status(201).json({
        success: true,
        isExist: true,
        message: 'Conversation already exist',
        data: isExist,
      });
    }
    const result = await ConversationModel.create(data);
    for (let index = 0; index < arr.length; index++) {
      const users = await User.findOne({ _id: mongoose.Types.ObjectId(arr[index]) }).lean();
      if (users.role === 'user') {
        const isParentExist = await User.findOne({
          _id: mongoose.Types.ObjectId(users.parentId),
        }).lean();
        if (isParentExist && isParentExist.email.length > 1) {
          await emailService.sendNewConvEmail(isParentExist, users.name);
        }
        if (isParentExist) {
          await smsService.sendNewConvmessage(isParentExist, users.name);
        }
        if (isParentExist && isParentExist.FCMToken.length > 1) {
          const obj = {
            name: users.name,
            parent_name: isParentExist.name,
          };
          await pushNotificationService.sendNewConvNotify(obj, isParentExist.FCMToken);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Conversation Added Successfully',
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
const conversationExist = async (req, res) => {
  try {
    const { body, user } = req;
    const { members, type } = body;

    const data = {
      members,
      type,
    };

    let membersData = [];
    if (members) {
      const memberId = await User.find({ uid: { $in: members } }, { _id: 1 }).lean();

      if (memberId) {
        for (const iterator of memberId) {
          membersData.push(iterator._id);
        }
      }

      // members.map(function (item) {
      //   const memberId =  User.findOne({uid:item},{_id:1}).lean();
      //   membersData.push(memberId._id)
      //   var isValid = mongoose.Types.ObjectId.isValid(item);
      //   if (!isValid) {
      //     return res.status(500).json({
      //       success: false,
      //       error: 'Something went wrong in create conversation',
      //     });
      //   }
      // });
    }
    let arr = membersData.map((item) => mongoose.Types.ObjectId(item));

    const isExist = await ConversationModel.findOne({ $and: [{ members: { $all: arr }, type }] }).lean();
    if (isExist) {
      return res.status(201).json({
        isExist: true,
        message: 'Conversation already exist',
        data: isExist,
      });
    } else {
      return res.status(200).json({
        isExist: false,
        message: 'Conversation does not exist',
        data: {},
      });
    }
  } catch (error) {
    console.log('354635645', error.message);
    return res.status(500).json({
      success: false,

      error: error.message,
    });
  }
};

const getMessageList = async (req, res, next) => {
  try {
    const { query, user } = req;
    // let user = '62f2541316272d7cecc9e9d0';
    //  const { search, gender, status } = query;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;
    const page = query.page ? parseInt(query.page, 10) : 1;
    const skip = (page - 1) * limit;
    // const data = await ConversationModel.find().populate('members');
    let data = [];
    try {
      data = await ConversationModel.aggregate([
        {
          $facet: {
            personal: [
              {
                $match: { type: 'personal', members: { $in: [mongoose.Types.ObjectId(user._id)] } },
              },
              {
                $addFields: {
                  memberss: {
                    $filter: {
                      input: '$members',
                      as: 'num',
                      cond: {
                        $ne: ['$$num', mongoose.Types.ObjectId(user._id)],
                      },
                    },
                  },
                },
              },
              {
                $lookup: {
                  from: 'users',
                  localField: 'memberss',
                  foreignField: '_id',
                  as: 'membersData',
                },
              },
              { $unwind: '$membersData' },
            ],
            groups: [
              {
                $match: { type: 'group', members: { $in: [mongoose.Types.ObjectId(user._id)] } },
              },
              { $addFields: { membersData: null } },
              {
                $lookup: {
                  from: 'groups',
                  localField: 'groupId',
                  foreignField: '_id',
                  as: 'groupData',
                },
              },
              { $unwind: '$groupData' },
              //  { $sort: { updatedAt: 1 } },
            ],
          },
        },

        {
          $project: {
            concatArr: {
              $concatArrays: ['$personal', '$groups'],
            },
          },
        },
        { $unwind: { path: '$concatArr', preserveNullAndEmptyArrays: true } },
        { $replaceRoot: { newRoot: '$concatArr' } },
        { $sort: { _id: 1 } },
        { $skip: skip },
        { $limit: limit },
      ]);
      let arr = [];
      if (data && data.length > 0) {
        for (let iterator of data) {
          if (iterator.groupId !== null) {
            const groupDetails = await GroupModel.findOne(
              {
                $and: [
                  { _id: mongoose.Types.ObjectId(iterator.groupId), members: { $in: mongoose.Types.ObjectId(user._id) } },
                ],
              },
              { _id: 1 }
            );
            if (groupDetails) {
              iterator = { ...iterator, groupDisable: false };
            } else {
              iterator = { ...iterator, groupDisable: true };
            }
          }
          let unreadCount = 0;
          unreadCount = await MessageModel.countDocuments({
            conversationId: mongoose.Types.ObjectId(iterator._id),
            status: 'unread',
          });
          iterator = { ...iterator, unreadCount };
          arr.push(iterator);
        }
      }
      return res.status(200).json({
        success: true,
        message: 'Conversation list fetch successfully',
        data: arr && arr.length ? arr : data,
      });
    } catch (error) {
      return res.status(201).json({
        success: true,
        message: 'Conversation list fetch successfully',
        data,
      });
    }

    // let data = await ConversationModel.aggregate([
    //   {
    //     $match: { type: 'personal', members: { $in: [mongoose.Types.ObjectId(user._id)] } },
    //   },
    //   {
    //     $lookup: {
    //       from: 'users',
    //       localField: 'members',
    //       foreignField: '_id',
    //       as: 'membersData',
    //     },
    //   },
    //   // {
    //   //   $lookup: {
    //   //     from: 'messages',
    //   //     localField: '_id',
    //   //     foreignField: 'conversationId',
    //   //     as: 'messagesData',
    //   //   },
    //   // },
    //   // {
    //   //   $match: { 'messagesData.status': 'unread' },
    //   // },
    //   { $sort: { _id: -1 } },
    //   { $skip: skip },
    //   { $limit: limit },
    // ]);
    // let arr =[]
    //   if(data && data.leangth){
    //     console.log("hellloooo");
    //     for (let iterator of data) {
    //      let unreadCount = 0
    //      unreadCount= await MessageModel.countDocuments({conversationId:mongoose.Types.ObjectId(iterator._id),status:"unread"})
    //      console.log(unreadCount,"count");
    //       iterator = {...iterator,unreadCount}
    //       arr.push(iterator)
    //     }
    //   }
    //   console.log("arr",arr);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'error',
      error: error.message,
    });
  }
};
const getGroupConversationList = async (req, res, next) => {
  try {
    const { query } = req;
    let user = '62f2541316272d7cecc9e9d0';
    //  const { search, gender, status } = query;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;
    const page = query.page ? parseInt(query.page, 10) : 1;
    const skip = (page - 1) * limit;

    // { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
    let data = await ConversationModel.aggregate([
      {
        $facet: {
          personal: [
            {
              $match: { type: 'personal', members: { $in: [mongoose.Types.ObjectId(user)] } },
            },
            {
              $addFields: {
                memberss: {
                  $filter: {
                    input: '$members',
                    as: 'num',
                    cond: {
                      $ne: ['$$num', mongoose.Types.ObjectId(user)],
                    },
                  },
                },
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'memberss',
                foreignField: '_id',
                as: 'membersData',
              },
            },
            { $unwind: '$membersData' },
          ],
          groups: [
            {
              $match: { type: 'group', members: { $in: [mongoose.Types.ObjectId(user)] } },
            },
            { $addFields: { membersData: null } },
            {
              $lookup: {
                from: 'groups',
                localField: 'groupId',
                foreignField: '_id',
                as: 'groupData',
              },
            },
            { $unwind: '$groupData' },
            //  { $sort: { updatedAt: 1 } },
          ],
        },
      },

      {
        $project: {
          concatArr: {
            $concatArrays: ['$personal', '$groups'],
          },
        },
      },
      { $unwind: { path: '$concatArr', preserveNullAndEmptyArrays: true } },
      { $replaceRoot: { newRoot: '$concatArr' } },
      { $sort: { _id: 1 } },
      { $skip: skip },
      { $limit: limit },
    ]);
    let arr = [];
    if (data && data.length > 0) {
      for (let iterator of data) {
        let unreadCount = 0;
        unreadCount = await MessageModel.countDocuments({
          conversationId: mongoose.Types.ObjectId(iterator._id),
          status: 'unread',
        });
        iterator = { ...iterator, unreadCount };
        arr.push(iterator);
      }
    }
    return res.status(200).json({
      success: true,
      message: 'Conversation list fetch successfully',
      data: arr && arr.length ? arr : data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'error',
      error: error.message,
    });
  }
};

const getMessageListEx = async (req, res, next) => {
  try {
    const { query } = req;
    let user = '62fbb8abb625af36d3425b77';
    //  const { search, gender, status } = query;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;
    const page = query.page ? parseInt(query.page, 10) : 1;
    const skip = (page - 1) * limit;

    const data = await ConversationModel.aggregate([
      {
        $match: { type: 'personal', members: { $in: [mongoose.Types.ObjectId(user)] } },
      },
      {
        $addFields: {
          memberss: {
            $filter: {
              input: '$members',
              as: 'num',
              cond: {
                $ne: ['$$num', mongoose.Types.ObjectId(user)],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'memberss',
          foreignField: '_id',
          as: 'membersData',
        },
      },
      { $unwind: '$membersData' },
      // {
      //   $lookup: {
      //     from: 'messages',
      //     localField: '_id',
      //     foreignField: 'conversationId',
      //     as: 'messagesData',
      //   },
      // },
      // {
      //   $match: { 'messagesData.status': 'unread' },
      // },
      // { $sort: { _id: -1 } },
      // { $skip: skip },
      // { $limit: limit },
    ]);
    return res.status(200).json({
      success: true,
      message: 'Conversation list fetch successfully',
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

const deleteConversation = async (req, res) => {
  try {
    const { user, params } = req;
    const { conversationId } = params;

    const result = await ConversationModel.updateOne(
      {
        _id: mongoose.Types.ObjectId(conversationId),
      },
      { $pull: { members: mongoose.Types.ObjectId(user._id) } }
    );

    //   const messageData = new Message(data);
    //   const result = await messageData.save();

    return res.status(200).json({
      success: true,
      message: 'Conversation delete Successfully',
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
module.exports = {
  createConversation,
  getMessageList,
  getMessageListEx,
  conversationExist,
  deleteConversation,
  getGroupConversationList,
};
