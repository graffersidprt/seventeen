const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
//const { smsService } = require('.');
const config = require('../config/config');
const logger = require('../config/logger');
const pushNotification = require('./pushNotification.service');
const Vonage = require('@vonage/server-sdk');
const { User } = require('../models');
const path = require('path');
const fs = require('fs');
// var admin 	= require('firebase-admin');
// const vonage = new Vonage({
//   apiKey: 'dc876e77',
//   apiSecret: 'UJ5MR55K0kNeMCgX',
// });
const vonage = new Vonage({
  apiKey: "8e4c0d72",
  apiSecret: "UhwAU9paet4F0teu"
})
//var serviceAccount = require('../config/ddlapp-f05e5-c5b415203af3.json');

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
// });

const transport = nodemailer.createTransport(config.email.smtp);

if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() => logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env'));
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text) => {
  try {
    const msg = { from: config.email.from, to, subject, text };
    await transport.sendMail(msg);
  } catch (error) {
    console.log("email error",error);
  }
 
};

/**
 * Send welcome email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendWelcomeEmail = async (userObj) => {
  const subject = 'Welcome to 7Teen';
  const text = `Dear ${userObj.parent_name},
  Welcome to 7Teen,

  Your child ${userObj.name} has created account on 7teen, you can login with your number ${userObj.parent_number}
  and approve his request to stay connected with his friends and family.
  
  If you did not create an account, then ignore this email.

  From 7Teen`;

  await sendEmail(userObj.email, subject, text);
};

/**send OTP mail */

const sendOTPEmail = async (to, otp) => {
  const subject = 'Email OTP';
  // const header = fs.readFileSync(
  //   path.join(__dirname, '..', 'emailTemplate', 'Header.html'),
  //   'utf8'
  // );

  // const footer = fs.readFileSync(
  //   path.join(__dirname, '..', 'emailTemplate', 'Footer.html'),
  //   'utf8'
  // );

//   let text = `${header}  <tr>
//   <td style="font-family: Montserrat, -apple-system, &#39;Segoe UI&#39;, sans-serif; padding:30px 40px; text-align: center;"
//      align="center">
//      <p>
//      Dear user,
//      To verify your account, use this OTP : ${otp}
//      If you did not create an account, then ignore this email.
//      </p>
//   </td>
// </tr>${footer}`;
 
  const text = `Dear user,
  To verify your account, use this OTP : ${otp}
  If you did not create an account, then ignore this email.`;
  await sendEmail(to, subject, text);
};

/**
 * Send  approval email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendApproveEmail = async (userObj) => {
  const subject = 'Welcome to 7Teen';

  const text = `Dear ${userObj.name},

  Your Account has been approved by your parent. 
  You can now stay connected with his friends and family.
  
  From 7Teen`;
  await sendEmail(userObj.email, subject, text);
};

/**
 * Send  approval email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendUnpproveEmail = async (userObj) => {
  const subject = 'Welcome to 7Teen';

  const text = `Dear ${userObj.name},

  Your Account has not been approved by your parent.
  
  From 7Teen`;
  await sendEmail(userObj.email, subject, text);
};

/**
 * Send new friend email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendNewConvEmail = async (userObj, childname) => {
  const subject = `New Friend by ${childname} at 7Teen`;

  const text = `Dear ${userObj.name},

  Your child ${childname} is connected with a new Friend.
  
From, 7Teen`;
  await sendEmail(userObj.email, subject, text);
};

/**
 * Send new group email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendNewGroupEmail = async (userObj) => {
  const subject = 'New Group Joined';

  const text = `Dear ${userObj.parent_name},

  Your child ${userObj.name} has joined a new group.
  
From, 7Teen`;
  await sendEmail(userObj.email, subject, text);
};
const sendNewGroupNotification = async (userarr, groupName) => {
  console.log('userarr', userarr);
  let membersData = [];
  if (userarr) {
    console.log('userarr2', userarr);
    const memberId = await User.find({ uid: { $in: userarr } }, { _id: 1 }).lean();

    if (memberId) {
      for (const iterator of memberId) {
        membersData.push(iterator._id);
      }
    }
  }
  const arr = membersData.map((item) => mongoose.Types.ObjectId(item));

  for (let index = 0; index < arr.length; index++) {
  
    const users = await User.findOne({ _id: mongoose.Types.ObjectId(arr[index]) }).lean();
    if (users.role === 'user') {
  
      const isParentExist = await User.findOne({
        _id: mongoose.Types.ObjectId(users.parentId),
      }).lean();
      if (isParentExist.email && isParentExist.email.length > 0) {
      
        const subject = 'New Group Joined';

        const text = `Dear ${isParentExist.name}, Your child ${users.name} has joined a new group From, 7Teen`;
        await sendEmail(isParentExist.email, subject, text);
      }
      if (isParentExist) {
     
        const from = '7teen';
       // const to = '91' + isParentExist.phone;
        const to = isParentExist.phoneCountryCode.substring(1) + isParentExist.phone;
        const text = `Dear ${isParentExist.name}, Your child ${users.name} has joined a new group`
        vonage.message.sendSms(from, toString, text, (err, responseData) => {
          if (err) {
            console.log(err);  
          } else {
            if (responseData.messages[0]['status'] === '0') {
              console.log('Message sent successfully.');
            } else {
              console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
            }
          }
        });
        await pushNotification.sendNewGroupPushNotification(users, isParentExist);
      }
    }
  }
};
const sendLeftGroupNotification = async (userarr, groupName) => {
  let membersData = [];
  if (userarr) {
    const memberId = await User.find({ uid: { $in: userarr } }, { _id: 1 }).lean();

    if (memberId) {
      for (const iterator of memberId) {
        membersData.push(iterator._id);
      }
    }
  }
  const arr = membersData.map((item) => mongoose.Types.ObjectId(item));
  for (let index = 0; index < arr.length; index++) {
    const users = await User.findOne({ _id: mongoose.Types.ObjectId(arr[index]) }).lean();
    if (users.role === 'user') {
      const isParentExist = await User.findOne({
        _id: mongoose.Types.ObjectId(users.parentId),
      }).lean();
      if (isParentExist.email && isParentExist.email.length > 0) {
        const subject = 'Left Group By your Child';

        const text = `Dear ${isParentExist.name},
  
    Your child ${users.name} has Left a group.
    
  From, 7Teen`;
        await sendEmail(isParentExist.email, subject, text);
      }
      if (isParentExist) {
        const from = '7teen';
       // const to = '91' + isParentExist.phone;
        const to = isParentExist.phoneCountryCode.substring(1) + isParentExist.phone;
        const text = `Dear ${isParentExist.name},
        Your child ${users.name} has Left a group.`;
        vonage.message.sendSms(from, to, text, (err, responseData) => {
          if (err) {
            console.log(err);
          } else {
            if (responseData.messages[0]['status'] === '0') {
              console.log('Message sent successfully.');
            } else {
              console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
            }
          }
        });
      
      }
      await pushNotification.sendLeftGroupPushNotification(users, isParentExist);
    }
  }
};

/**
 * Send block email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendBlockEmail = async (userObj, parentObj) => {
  const subject = 'Blocked user';

  const text = `Dear ${parentObj.name},

  Your child ${userObj.name} has blocked a user.
  
From, 7Teen`;
  await sendEmail(parentObj.email, subject, text);
};

/**
 * Send unblock email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendUnBlockEmail = async (userObj, parentObj) => {
  const subject = 'UnBlocked user';

  const text = `Dear ${parentObj.name},

  Your child ${userObj.name} has unblocked a user.
  
From, 7Teen`;
  await sendEmail(parentObj.email, subject, text);
};

module.exports = {
  transport,
  sendEmail,
  sendOTPEmail,
  sendWelcomeEmail,
  sendApproveEmail,
  sendUnpproveEmail,
  sendNewConvEmail,
  sendNewGroupEmail,
  sendNewGroupNotification,
  sendLeftGroupNotification,
  sendUnBlockEmail,
  sendBlockEmail,
};
