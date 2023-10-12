const config = require('../config/config');
const logger = require('../config/logger');

const Vonage = require('@vonage/server-sdk');

// const vonage = new Vonage({
//   apiKey: 'dc876e77',
//   apiSecret: 'UJ5MR55K0kNeMCgX'
// })

const vonage = new Vonage({
  apiKey: '8e4c0d72',
  apiSecret: 'UhwAU9paet4F0teu',
});

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {};

/**
 * Send welcome email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendWelcomeMessage = async (userObj) => {
  const from = '7teen';
  // const to = '91'+ userObj.parent_number;
  const to = userObj.parentPhoneCountryCode.substring(1) + userObj.parent_number;
  const text = `Dear ${userObj.parent_name},
	Your child ${userObj.name} has created account on 7teen.`;

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
};

/**
 * Send welcome email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendApprovemessage = async (userObj) => {
  const from = '7teen';
  // const to = '91'+ userObj.phone;
  const to = userObj.phoneCountryCode.substring(1) + userObj.phone;
  const text = `Dear ${userObj.name},
	Your Account has been approved by your parent.`;

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
};

/**
 * Send welcome email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendNewConvmessage = async (userObj, childName) => {
  const from = '7teen';
  //const to = '91'+ userObj.phone;
  const to = userObj.phoneCountryCode.substring(1) + userObj.phone;
  const text = `Dear ${userObj.name},

	Your child ${childName} is connected with a new Friend.`;

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
};

/* send sms to user */
const sendOTPSms = async (to_number, otp) => {
  const from = '7teen';
  //const to = '91'+ to_number;
  const to = to_number.substring(1);
  const text = `Dear user,
To verify your account, use this OTP : ${otp}
From 7Teen`;

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
};

module.exports = {
  sendOTPSms,
  sendWelcomeMessage,
  sendApprovemessage,
  sendNewConvmessage,
};
