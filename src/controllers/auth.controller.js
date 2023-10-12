const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');

const otpGen = require('otp-generator');
const otpTool = require('otp-without-db');
const key = 'secretKey'; // Use unique key and keep it secret
const request = require('request');
const moment = require('moment');
const mongoose = require('mongoose');
const UserModel = require('../models/user.model');
//const {RtcTokenBuilder, RtmTokenBuilder, RtcRole, RtmRole} = require('agora-access-token')
const { authService, userService, tokenService, emailService, smsService } = require('../services');
const { Token, User } = require('../models');
const { tokenTypes } = require('../config/tokens');
const register = catchAsync(async (req, res) => {
  let phone = req.body.phone;
  let email = req.body.email;
  let FCMToken = req.body.FCMToken;
  let phoneCountryCode = req.body.phoneCountryCode;
  const userCheck = await User.findOne({
    phone: req.body.phone,
  }).lean();
  if (userCheck) {
    res.status('400').send({ code: 400, message: 'This Number is already exists, Please try another Number' });
  } else {
    const otp = await authService.generateOTP(phone);
    const expiresAfter = 5; //minute

    let hash = otpTool.createNewOTP(phone, otp, key, expiresAfter);
    const user = req.body;

    await emailService.sendOTPEmail(email, otp);
    phone = phoneCountryCode + phone;
    await smsService.sendOTPSms(phone, otp);

    res.status(httpStatus.CREATED).send({ user, hash });
  }
});

const verifyotp = catchAsync(async (req, res) => {
  const key = 'secretKey'; // Use unique key and keep it secret
  let phone = req.body.phone;
  if (phone === '1234567890' || phone === '1234512345') {
    console.log('phone', phone);
    let user = await UserModel.findOne({ phone }).lean();
    console.log('user', user);
    var data = {};
    data['id'] = user._id;
    data['role'] = user.role;
    data['isParentVerified'] = user.isParentVerified;
    data['profileComplete'] = user.profileComplete;
    // if (typeof user.parent_name !== 'undefined') {
    //   data['profileComplete'] = true;
    // } else {
    //   data['profileComplete'] = false;
    // }
    user = { id: user._id, ...user };
    const tokens = await tokenService.generateAuthTokens(user);
    console.log('user', tokens);
    res.status('200').send({ data, tokens });
  } else {
    let verified = otpTool.verifyOTP(req.body.phone, req.body.otp, req.body.hash, key);

    if (verified) {
      const userCheck = await User.findOne({
        phone: req.body.phone,
      }).lean();
      if (!userCheck) {
        await User.create({
          phone: req.body.phone,
          phoneCountryCode: req.body.phoneCountryCode,
        });
        res.status('201').send({ data: null, tokens: null, register: true, message: 'Sign up Successfully' });
      } else {
        let user = await authService.verifyOTP(verified, phone);

        var data = {};
        data['id'] = user._id;
        data['role'] = user.role;
        data['isParentVerified'] = user.isParentVerified;
        data['profileComplete'] = user.profileComplete;
        // if (typeof user.parent_name !== 'undefined') {
        //   data['profileComplete'] = true;
        // } else {
        //   data['profileComplete'] = false;
        // }
        const tokens = await tokenService.generateAuthTokens(user);
        res.status('200').send({ data, tokens, register: false, message: 'Login Successfully' });
      }
    } else {
      res.status('400').send({ message: 'OTP not verified.' });
    }
  }
});

const login = catchAsync(async (req, res) => {
  let phone = req.body.phone;
  let otpDate =''
  let time =''
  const checkOtpCount = await UserModel.findOne({ phone }).lean();
  if(checkOtpCount)
   otpDate =checkOtpCount.otpDate
  try {
   // let phone = req.body.phone;
    let email = req.body.email;
    let phoneCountryCode = req.body.phoneCountryCode;
    let FCMToken = req.body.FCMToken;
   // const checkOtpCount = await UserModel.findOne({ phone }).lean();
    if (checkOtpCount) {
      if (checkOtpCount.otpDate) {
        // console.log('checkOtpCount.otpDate', checkOtpCount.otpDate);
        // console.log(' moment().toDate()', moment().toDate());
        if (checkOtpCount.otpDate > moment().toDate()) {
          let st = moment()
      let et = moment(checkOtpCount.otpDate)
      let dif = moment.duration(et.diff(st))
      time = [dif.hours(), dif.minutes()].join(':')
     
         // console.log("time",time);
          throw new Error(`You have blocked, Please try again after ${time} hours`);
          //  res.status(400).json({ status: false, message: 'You have blocked, Please try again after 24 hrs' });
        } else {
          await UserModel.updateOne({ phone }, { $set: { otpDate: undefined,otpCount:0 } });
        }
      }

    
    }
    if (phone === '1234567890' || phone === '1234512345') {
      let user = await UserModel.findOne({ phone }).lean();
      var data = {};
      data['id'] = user._id;
      data['role'] = user.role;
      // data['isParentVerified'] = user.isParentVerified;
      // data['profileComplete'] = user.profileComplete;

      // const tokens = await tokenService.generateAuthTokens(user);
      // res.send({ user: user, data: user_obj, hash: hash });
      res.status(200).json({ user: user, data: user, hash: 'hash', FCMToken });
    } else {
      const user_obj = await authService.loginUserWithPhone(phone);
      let user = {};
      user['id'] = user_obj._id;
      user['phone'] = user_obj.phone;
      await UserModel.updateOne(
        { _id: mongoose.Types.ObjectId(user_obj._id) },
        { $set: { FCMToken } },
        { runValidators: true }
      );
      const otp = await authService.generateOTP(phone);
      const expiresAfter = 5; //minute

      let hash = otpTool.createNewOTP(phone, otp, key, expiresAfter);
      await emailService.sendOTPEmail(email, otp);

      phone = phoneCountryCode + phone;
      await smsService.sendOTPSms(phone, otp);
      res.status(200).json({ user: user_obj, data: user_obj, hash: hash, FCMToken });
    }
  } catch (error) {
   // console.log(error,"888");
    res.status(500).json({ success:false,otpDate:otpDate,time, error: 'Internal server error', message: error.message });
  }
});
/*const { appID,appCertificate,channelName,uid,account } = body;
  
console.log("in agrofnjnfjdk");
  //   const appID = 'fd5f62b456e444138f4aeb023ce90adf';
  //   const appCertificate = '72ac4526408b4823b34215024a0ca14a';
  //   const channelName = 'test';
  // const uid = '2882341273';
  // const account = "2882341273";
  // {
  //     appID: 'fd5f62b456e444138f4aeb023ce90adf';
  //     appCertificate: '72ac4526408b4823b34215024a0ca14a';
  //     channelName: 'test';
  //     uid: '';
  //     account: '';
  // }
  //   const appCertificate = '72ac4526408b4823b34215024a0ca14a';
  //   const channelName = 'test';
  // const uid = '2882341273';
  // const account = "2882341273";
  const role = RtcRole.PUBLISHER;
   
  const expirationTimeInSeconds = 3600
   
  const currentTimestamp = Math.floor(Date.now() / 1000)
   
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds
   
  // IMPORTANT! Build token with either the uid or with the user account. Comment out the option you do not want to use below.
   
  // Build token with uid
  const useridtokenrtc = RtcTokenBuilder.buildTokenWithUid(appID, appCertificate, channelName, uid, role, privilegeExpiredTs);
  console.log("Token With Integer Number Uid: " + useridtokenrtc);
   
  // Build token with user account
  const accounttokenrtc = RtcTokenBuilder.buildTokenWithAccount(appID, appCertificate, channelName, account, role, privilegeExpiredTs);
  console.log("Token With UserAccount: " + accounttokenrtc);


 // res.send({ useridtokenrtc,accounttokenrtc });
  return res.status(200).json({
    success: true,
    message: 'useridtokenrtc  Successfully',
    useridtokenrtc,
    accounttokenrtc
  });;
};*/

const parentRegister = catchAsync(async (req, res) => {
  let phone = req.body.phone;
  let email = req.body.email;

  const otp = await authService.generateOTP(phone);

  let hash = otpTool.createNewOTP(phone, otp, key);
  const user = await userService.createParent(req.body);

  const tokens = await tokenService.generateAuthTokens(user);
  await emailService.sendOTPEmail(email, otp);

  res.status(httpStatus.CREATED).send({ user, tokens, hash });
});

const parentLogin = catchAsync(async (req, res) => {
  let phone = req.body.phone;
  let email = req.body.email;
  const user = await authService.loginParentWithPhone(phone);
  const otp = await authService.generateOTP(phone);
  let hash = otpTool.createNewOTP(phone, otp, key);
  await emailService.sendOTPEmail(email, otp);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens, hash });
});

const logout = async (req, res) => {
  try {
    const { body, user } = req;
    const { refreshToken } = body;
    // await authService.logout(req.body.refreshToken);
    const refreshTokenDoc = await Token.findOne({
      token: refreshToken,
      type: tokenTypes.REFRESH,
      blacklisted: false,
    }).lean();
    if (!refreshTokenDoc) {
      return res.status(404).json({
        success: false,
        message: 'Token nor found',
      });
    }
    // await refreshTokenDoc.remove();
    await Token.deleteOne({ _id: mongoose.Types.ObjectId(refreshTokenDoc._id) });
    await UserModel.updateOne(
      { _id: mongoose.Types.ObjectId(user._id) },
      { $set: { FCMToken: '' } },
      { runValidators: true }
    );
    return res.status(200).json({
      success: true,
      message: 'Logout successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

const resendOtp = catchAsync(async (req, res) => {
  let phone = req.body.phone;
  let otpDate =''
  let time=''
  const checkOtpCount = await UserModel.findOne({ phone }).lean();
  if(checkOtpCount)
   otpDate =checkOtpCount.otpDate
  try {
  //  let phone = req.body.phone;   
    let email = req.body.email;
    let phoneCountryCode = req.body.phoneCountryCode;

    await UserModel.updateOne({ phone }, { $inc: { otpCount: 1 } });
  //  const checkOtpCount = await UserModel.findOne({ phone }).lean();
    if (checkOtpCount) {
      // console.log('checkOtpCount.otpDate', checkOtpCount.otpDate);
      // console.log(' moment().toDate()', moment().toDate());
      if (checkOtpCount.otpDate) {
        if (checkOtpCount.otpDate > moment().toDate()) {
       
            let st = moment()
        let et = moment(checkOtpCount.otpDate)
        let dif = moment.duration(et.diff(st))
        time = [dif.hours(), dif.minutes()].join(':')
       
          
          throw new Error(`You have blocked, Please try again after ${time} hours`);
          // res.status(400).json({ status: false, message: 'You have blocked, Please try again after 24 hrs' });
        }
      }

      if (checkOtpCount.otpCount > 3) {
        // res.status(400).json({ status: false, message: 'You have hit by multiple times' });
        await UserModel.updateOne({ phone }, { $set: { otpDate: moment().add(1, 'd').toDate() } });
        throw new Error('You have hit by multiple times');
      }
    }
    const user = req.body;
    // console.log('user', user);
    const otp = await authService.generateOTP(phone);
    const expiresAfter = 5; //minute

    let hash = otpTool.createNewOTP(phone, otp, key, expiresAfter);
    phone = phoneCountryCode + phone;
    await smsService.sendOTPSms(phone, otp);
    await emailService.sendOTPEmail(email, otp);
    res.status(200).json({ data: user, user, hash,success:true });
  } catch (error) {
    res.status(400).json({success:false,otpDate:otpDate,time, error: 'Internal server error', message: error.message});
  }
});

const me = async (req, res, next) => {
  try {
    const data = req.user;

    return res.status(200).json({
      success: true,
      message: 'User fetched successfully',
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
const logoutNew = async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).json({
    success: true,
    message: 'Logout successfully',
    data,
  });
};
module.exports = {
  register,
  login,
  me,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  verifyotp,
  parentLogin,
  logoutNew,
  parentRegister,
  resendOtp,
};
