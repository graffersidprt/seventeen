const httpStatus = require('http-status');
const mongoose = require('mongoose');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService, emailService, smsService, pushNotificationService } = require('../services');
const UserModel = require('../models/user.model');
const GroupModel = require('../models/group.model');
const ConversationModel = require('../models/conversation.model');
var multer = require('multer');
var bodyParser = require('body-parser');
var express = require('express');
var request = require('request');
const config = require('../config/config');
var app = express();
const path = require('path');
const Mongoose = require('mongoose');
const { User } = require('../models');
const { throws } = require('assert');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

// const getUsers = catchAsync(async (req, res) => {
//   const filter = pick(req.query, ['name', 'role']);
//   const options = pick(req.query, ['sortBy', 'limit', 'page']);
//   const result = await userService.queryUsers(filter, options);
//   res.send(result);
// });
const getUsers = async (req, res, next) => {
  try {
    const { query, user } = req;

    const limit = query.limit ? parseInt(query.limit, 10) : 10;
    const page = query.page ? parseInt(query.page, 10) : 1;
    const skip = (page - 1) * limit;
    const { search, role } = query;

    let condition = {};
    //let condition = { _id:Mongoose.Types.ObjectId(user._id) };
    if (search) {
      condition = {
        ...condition,
        $or: [
          {
            name: {
              $regex: new RegExp(search.trim(), 'i'),
            },
          },
          {
            role: {
              $regex: new RegExp(search.trim(), 'i'),
            },
          },
        ],
      };
    }
    if (role) {
      condition = {
        ...condition,
        role,
      };
    }

    const data = await UserModel.aggregate([
      {
        $match: condition,
      },

       { $sort: { _id: -1 } },
      // { $skip: skip },
      // { $limit: limit },
    ]);
    const totalRecords = await UserModel.aggregate([
      {
        $match: condition,
      },

      {
        $count: 'count',
      },
    ]);

    return res.status(200).json({
      success: true,
      message: 'User list fetch successfully',
      data,
      totalRecords: totalRecords && totalRecords.length ? totalRecords[0].count : 0,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'error',
      error: error.message,
    });
  }
};

const getUser = async (req, res) => {
 
  try {
    const { params, user } = req;
    const { userId } = params;


    const createrData = await UserModel.findOne({ _id: mongoose.Types.ObjectId(userId) }).lean();
    let data = await GroupModel.find({ members: { $all: [user._id, userId] } }).lean();
    let result = { commonGroups: [], ...createrData };
    //let result = { commonGroups: data ? data : [], ...createrData };
 
    return res.status(200).json({
      success: true,
      message: 'User view fetched successfully',
      user: createrData,
      // createrData,
      // d
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const blockUser = async (req, res) => {
  try {
    const { params, user, query } = req;
    const { userId } = params;
    const { blockStatus } = query;
    let msg = '';
    let blockuser;
    if (blockStatus === true) {
      blockuser = await UserModel.updateOne(
        { _id: mongoose.Types.ObjectId(userId) },
        {
          $addToSet: {
            blockedByUsers: mongoose.Types.ObjectId(user._id),
          },
        }
      );
      msg = 'User Blocked successfully';
    }

    if (blockStatus === false) {
      blockuser = await UserModel.updateOne(
        { _id: mongoose.Types.ObjectId(userId) },
        {
          $pull: {
            blockedByUsers: mongoose.Types.ObjectId(user._id),
          },
        }
      );
      //send mail to parent

      msg = 'User UnBlocked successfully';
    }

   
    return res.status(200).json({
      success: true,
      message: msg,
      data: blockuser,
      // createrData,
      // d
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getUserName = catchAsync(async (req, res) => {
  var parent_name = req.body.parent_name;
  var parent_number = req.body.parent_number;

  if (parent_name && parent_number) {
    var username = parent_name.substring(0, 4) + '' + parent_number.substr(parent_number.length - 4);
  }
  res.send(username);
});

const getChilds = catchAsync(async (req, res) => {
  const childs = await userService.getChilds(req.params.userId);
  res.send(childs);
});
const getChildsNew = async (req, res) => {
  try {
    const { params, user } = req;
    const { userId } = params;
    //console.log(userId);
    const childData = await UserModel.find({ parentId: mongoose.Types.ObjectId(userId) }).lean();
    return res.status(200).json({
      success: true,
      message: 'Child list fetched Successfully',
      data: childData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
const getChildFriendList = async (req, res) => {
  try {
    const { params, user } = req;
    const { childId } = params;
    //  const { search, gender, status } = query;

    let childDataWithFriendDetails = await ConversationModel.aggregate([
      {
        $match: { type: 'personal', members: { $in: [mongoose.Types.ObjectId(childId)] } },
      },
      {
        $addFields: {
          friends: {
            $filter: {
              input: '$members',
              as: 'num',
              cond: {
                $ne: ['$$num', mongoose.Types.ObjectId(childId)],
              },
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'friends',
          foreignField: '_id',
          as: 'friendsData',
        },
      },

      { $unwind: { path: '$friendsData', preserveNullAndEmptyArrays: true } },
      { $replaceRoot: { newRoot: '$friendsData' } },
      // {
      //   $project: {
      //     _id: 0,
      //     friendsData: '$friendsData',
      //   },
      // },
    ]);

    return res.status(200).json({
      success: true,
      message: 'Child friend list fetched Successfully',
      data: childDataWithFriendDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
const getParentDetails = async (req, res) => {
  try {
    const { params, user, query } = req;
    const { parentId } = query;
    //  const { search, gender, status } = query;
    const parentData = await UserModel.find({ _id: mongoose.Types.ObjectId(parentId) }).lean();
    if (!parentData) {
      return res.status(404).json({
        success: false,
        message: 'Data Not Found',
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Parent Data fetched Successfully',
      data: parentData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const approveChild = async (req, res) => {
  try {
    const data = req.user;
    let userId = req.body.userId;
    let childId = req.body.childId;
   
    const updated = await User.updateOne({ _id: mongoose.Types.ObjectId(childId) },{$set:{ isParentVerified: true }})
    const user = await User.findOne({ _id: mongoose.Types.ObjectId(childId) }).lean();
    try {
      if(user.email && user.email.length > 1)
      await emailService.sendApproveEmail(user);
    } catch (error) {
      console.log('error while sending email Notifications', error);
    }
    try {
      if(user.FCMToken && user.FCMToken.length > 1)
      await pushNotificationService.sendApproveNotify(user);
    } catch (error) {
      console.log('error while sending push Notifications', error);
    }
    return res.status(200).json({
      success: true,
      message: 'User Approved Successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
};

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  /*if(typeof user.parent_name !== 'undefined')
  {
    //prent created already
    console.log('already');
  }
  else
  {*/
  if (user.role == 'user') {
    const data = {
      name: req.body.parent_name,
      phone: req.body.parent_number,
      role: 'parent',
    };
    console.log(data);
    const parent = await userService.createParent(data);
  }

  //}
  res.send(user);
});
const updateUserNew = async (req, res) => {
  try {
    const { body, user, params } = req;
    const { name, email, dob, gender } = body;
    const { userId } = params;

    if (user.role === 'user') {
      let obj = {
        parent_name: body.parent_name,
        parent_number: body.parent_number,
        parent_username: body.parent_username,
        parentPhoneCountryCode: body.parentPhoneCountryCode,
        name,
        //  phone,
        email,
        dob,
        gender,
      };
      const parentExist = await UserModel.findOne({ phone: body.parent_number }).lean();
      if (!parentExist) {
        const parentObj = {
          name: req.body.parent_name,
          phone: req.body.parent_number,
          parent_username: body.parent_username,
          phoneCountryCode: body.parentPhoneCountryCode,
          role: 'parent',
        };
        const parentData = await UserModel.create(parentObj);
        obj = {
          parent_name: body.parent_name,
          parent_number: body.parent_number,
          name,
          // phone,
          dob,
          email,
          gender,
          parent_username: body.parent_username,
          parentId: parentData._id,
        };
        await UserModel.updateOne({ _id: mongoose.Types.ObjectId(params.userId) }, { $set: obj }, { runValidators: true });
        await UserModel.updateOne(
          { _id: mongoose.Types.ObjectId(params.userId) },
          { $set: { profileComplete: true } },
          { runValidators: true }
        );
       // await smsService.sendWelcomeMessage(body);
      } else {
        obj = {
          name,
          // phone,
          dob,
          email,
          gender,
          parent_name: body.parent_name,
          parent_number: body.parent_number,
          parent_username: body.parent_username,
          parentPhoneCountryCode: body.parentPhoneCountryCode,
          parentId: parentExist._id,
        };
        await UserModel.updateOne({ _id: mongoose.Types.ObjectId(params.userId) }, { $set: obj }, { runValidators: true });
        await UserModel.updateOne(
          { _id: mongoose.Types.ObjectId(params.userId) },
          { $set: { profileComplete: true } },
          { runValidators: true }
        );
        // await smsService.sendWelcomeMessage(body);
      }
      await smsService.sendWelcomeMessage(body);
    }
    // For admin update
    else {
      const parentObj = {
        name,
        //   phone,
        dob,
        email,
        gender,
      };
      await UserModel.updateOne(
        { _id: mongoose.Types.ObjectId(params.userId) },
        { $set: parentObj },
        { runValidators: true }
      );
      await UserModel.updateOne({ _id: mongoose.Types.ObjectId(params.userId) }, { $set: { profileComplete: true } });
    }
   
    const options = {
      method: 'POST',
     
      url: `https://${config.cometchat.appid}.api-${config.cometchat.appcountry}.cometchat.io/v3/users`,
      headers: {
        apiKey:config.cometchat.restapikey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: {
        metadata: { '@private': { contactNumber: user.phone, email } },
        uid: userId,
        name,
        role: user.role,
        withAuthToken: true,
      },
      json: true,
    };
    let cometchatAuthtoken = '';

    request(options, async function (error, response, body) {
      if (error) throw new Error(error);

      if (body.error) {
        return res.status(400).json({
          success: false,
          data: body.error,
          message: body.error.message,
          cometchatAuthtoken: user.cometchatAuthtoken,
        });
      }
      if (body.data) {
      
        await UserModel.updateOne(
          { _id: mongoose.Types.ObjectId(params.userId) },
          {
            $set: {
              uid: params.userId,
              cometchatAuthtoken: body.data.authToken,
            },
          }
        );
        return res.status(200).json({
          success: true,
          data: body.data,
          profileComplete: true,
          message: 'User Updated Successfully',
          cometchatAuthtoken: body.data.authToken,
        });
      }
    });
   
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
const updateUserInSetting = async (req, res) => {
  try {
    const { body, user, params } = req;
    const { name } = body;
    const { userId } = params;

    const obj = {
      name,
    };

    const data = await UserModel.updateOne({ _id: mongoose.Types.ObjectId(params.userId) }, { $set: obj });
    console.log('data', data);
    return res.status(200).json({
      success: true,
      data,
      message: 'User Updated Successfully',
    });

    // return res.status(200).json({
    //   success: true,
    //   cometchatAuthtoken,
    //   message: 'User Updated Successfully',
    // });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

const uploadPic = catchAsync(async (req, res) => {
  var storage = multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, './public/uploads/');
    },
    filename: function (req, file, callback) {
      //console.log(file);
      filename1 = file.originalname;
      var ext = filename1.substring(filename1.indexOf('.'));

      callback(null, file.fieldname + '-' + Date.now() + ext);
    },
  });

  const fileFilter = (req, file, callback) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      callback(null, true);
    } else {
      res.status(401).send({ message: 'Jpeg, Png allowed only' });
      return;
    }
  };

  const maxSize = 25 * 1000;

  var upload = multer({ storage: storage, limits: { fileSize: maxSize }, fileFilter }).single('avatar');
  upload(req, res, function (err) {
    if (req.file) {
      //let imgPath = 'http://ec2-3-110-134-28.ap-south-1.compute.amazonaws.com:3000/'+ req.file.filename;
      const pathName = req.file.path;
      console.log(pathName);
      if (err) {
        console.log(err);
        res.status(401).send({ message: 'Error uploading file.' });
        return;
      }
      console.log(req.body.userId);
      const user = userService.updateImageById(req.body.userId, pathName);
      res.status(200).send({ message: 'Profile pic is uploaded.', user: user });
      return;
    } else {
      res.status(401).send({ message: 'Error uploading file2.' });
      return;
    }
  });
});

const uploadPicNew = async (req, res) => {
  try {
    const { file, params } = req;
    if (file === undefined) {
      return res.status(400).json({
        message: 'Please upload a file!',
      });
    }
    let filePath = '';
    filePath = `/uploads/${file.filename}`;
    await UserModel.updateOne(
      { _id: mongoose.Types.ObjectId(params.userId) },
      {
        $set: {
          user_image_path: filePath,
        },
      }
    );
  
    return res.status(200).json({
      success: true,
      filePath,
      message: 'User Image Uploaded Successfully',
    });
    // eslint-disable-next-line no-use-before-define
    // const filePath = path.join(__dirname, `../../../uploads/${file.filename}`);
  } catch (error) {
    console.log("error in main upload pic function",error);
    return res.status(500).json({
      error:error,
      errorResponse:"error in file upload",
      message: error.message,
    });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getParentDetails,
  getChildFriendList,
  blockUser,
  uploadPicNew,
  uploadPic,
  updateUserInSetting,
  getChildsNew,
  getUserName,
  updateUserNew,
  getChilds,
  approveChild,
};
