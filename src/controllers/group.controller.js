const httpStatus = require('http-status');
const pick = require('../utils/pick');
const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const GroupModel = require('../models/group.model');
const UserModel = require('../models/user.model');
var multer = require('multer');
var bodyParser = require('body-parser');
var express = require('express');
var app = express();
const path = require('path');
const { Conversation } = require('../models');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const createGroup = async (req, res) => {
  try {
    const { body, user } = req;
    const { members, admins, creater, name } = body;
  
    const roomId = Math.random().toString(16).substr(2, 8); // 6de5ccda
    let data = {
      members,
      admins,
      creater,
      name,
      roomId,
    };
   
    const result = await GroupModel.create(data);
   
    const conversationData = {
      members,
      groupId:result._id,
      type:'group',
    };
  const result2 =await Conversation.create(conversationData)
   
     return res.status(200).json({
      success: true,
      message: 'Group Added Successfully',
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
const updateGroup = async (req, res) => {
  try {
    const { body, user, params } = req;
    const { members, admins, name } = body;
    const { id } = params;
    const data = {
      members,
      admins,
      name,
    };
    const result = await GroupModel.updateOne(
      {
        _id: mongoose.Types.ObjectId(id),
      },
      {
        $addToSet: {
          members,
          admins,
        },
        $set: {
          name,
        },
      }
    );
    //   const messageData = new Message(data);
    //   const result = await messageData.save();

    return res.status(200).json({
      success: true,
      message: 'Group Updated Successfully',
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
const leaveGroup = async (req, res) => {
  try {
    const { body, user, params } = req;
    const { memberId, groupId } = body;

    const result = await GroupModel.updateOne(
      {
        _id: mongoose.Types.ObjectId(groupId),
      },
      { $pull: { members: memberId } }
    );
   
    //   const messageData = new Message(data);
    //   const result = await messageData.save();

    return res.status(200).json({
      success: true,
      message: 'User leaved Group Successfully',
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

const getGroupList = async (req, res) => {
  try {
    const { query } = req;
    //  const { search, gender, status } = query;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;
    const page = query.page ? parseInt(query.page, 10) : 1;
    const skip = (page - 1) * limit;
    const data = await GroupModel.find().skip(skip).limit(limit);
    return res.status(200).json({
      success: true,
      message: 'Group list fetch successfully',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getGroupView = async (req, res) => {
  try {
    const { params } = req;
    const { id } = params;
    //  const { search, gender, status } = query;

    const d = await GroupModel.findOne({ _id: mongoose.Types.ObjectId(id) });
    const createrData = await UserModel.findOne({ _id: mongoose.Types.ObjectId(d.creater) }).lean();
    let data = await GroupModel.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(id) },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'members',
          foreignField: '_id',
          as: 'userData',
        },
      },
     
    ]);
    let result = {...data[0],createrData}
    return res.status(200).json({
      success: true,
      message: 'Group view fetched successfully',
      data:result,
     // createrData,
   // d      

    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
const groupDelete = async (req, res) => {
  try {
    const { params } = req;
    const { id } = params;
    //  const { search, gender, status } = query;

    const data = await GroupModel.deleteOne({ _id: mongoose.Types.ObjectId(id) });
   
    return res.status(200).json({
      success: true,
      message: 'Group deleted successfully',
      data

    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};


const updateGroupPic = catchAsync(async (req, res) => {
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

  var upload = multer({ storage: storage, limits: { fileSize: maxSize }, fileFilter }).single('group_pic');
  upload(req, res, function (err) {
  if(req.file)
	{
    const pathName=req.file.path;
  
		if (err) {
		  console.log(err);
		  res.status(401).send({ message: 'Error uploading file.' });
		  return;
		}
  
		const user = groupService.updateImageById(req.body.userId, pathName);
		res.status(200).send({ message: 'Group pic is uploaded.', user: user });
		return;
	  
	}
	else
	{
		res.status(401).send({ message: 'Error uploading file2.' });
		return;
	}
	});
    
});

module.exports = {
  createGroup,
  updateGroup,
  getGroupList,
  leaveGroup,
  groupDelete,
  getGroupView,
  updateGroupPic,
};
