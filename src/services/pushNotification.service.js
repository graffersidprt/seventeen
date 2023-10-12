const config = require('../config/config');
const logger = require('../config/logger');

var admin = require('firebase-admin');

//var serviceAccount = require('../config/teen-fcf73-f29ba726bcd9.json');
var serviceAccount = require('../config/seventeen-b2094-844284cb9798.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

/**
 * Send an notification sample
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (FCMToken) => {
  var message = {
    notification: {
      title: 'appointment status : ',
      body: 'your appointment has been booked on next day',
    },
    /*data: {
        score: '850',
        time: '2:45'
      },*/
    token: FCMToken,
  };

  admin
    .messaging()
    .send(message)
    .then(function (response, err) {
      console.log('Notification ID : =>', response);
      if (response) {
        console.log('Notification Send Successfully');
        return;
      } else {
        console.log('Notification not sent', err);
      }
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });
};

/**
 * Send welcome email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendWelcomeNotify = async (userObj, FCMToken) => {
  var message = {
    notification: {
      title: 'Welcome to 7Teen',
      body: `Dear ${userObj.parent_name},
        Your child ${userObj.name} has created account on 7teen.`,
    },
    token: FCMToken,
  };
  admin
    .messaging()
    .send(message)
    .then(function (response, err) {
      console.log('Notification ID : =>', response);
      if (response) {
        console.log('Notification Send Successfully');
        return;
      } else {
        console.log('Notification not sent', err);
      }
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });
};

/**
 * Send approval notify
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendBlockUserNotification = async (userObj,parentObj) => {
  var message = {
    notification: {
      title: 'Blocked user',
      body:`Dear ${parentObj.name},

      Your child ${userObj.name} has blocked a user.
      
    From, 7Teen`,
    },
    token: parentObj.FCMToken,
  };
  admin
    .messaging()
    .send(message)
    .then(function (response, err) {
      console.log('Notification ID : =>', response);
      if (response) {
        console.log('Notification Send Successfully');
        return;
      } else {
        console.log('Notification not sent', err);
      }
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });
};
const sendNewGroupPushNotification = async (userObj,parentObj) => {
    console.log("userObj,parentObj",userObj,parentObj);
  var message = {
    notification: {
      title: 'New Group Joined',
      body:`Dear ${parentObj.name},

      Your child ${userObj.name} has joined a new group.
      
    From, 7Teen`
    },
   token: parentObj.FCMToken,
   // token: "eMFNtncuTfWKbSBVK2e866:APA91bHYRZLzainBPrWR8lFsswsAoiny47O2YImVpBfLrYufGFHIz4XCa94NpwqLUiuJCUnpQ17fk3IGmG1mgrJos1YZaWLGtbmOcvEF31fF0qBJ6_j6AIMEgF5P2YHdTLprRWlLmOBE",
  };
  admin
    .messaging()
    .send(message)
    .then(function (response, err) {
      console.log('Notification ID : =>', response);
      if (response) {
        console.log('Notification Send Successfully');
        return;
      } else {
        console.log('Notification not sent', err);
      }
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });
};
const sendLeftGroupPushNotification = async (userObj,parentObj) => {
  var message = {
    notification: {
      title: 'Left Group By your Child',
      body:`Dear ${parentObj.name},

      Your child ${userObj.name} has Left a group.
      
    From, 7Teen`,
    },
    token: parentObj.FCMToken,
  };
  admin
    .messaging()
    .send(message)
    .then(function (response, err) {
      console.log('Notification ID : =>', response);
      if (response) {
        console.log('Notification Send Successfully');
        return;
      } else {
        console.log('Notification not sent', err);
      }
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });
};
const sendUnBlockUserNotification = async (userObj,parentObj) => {
  var message = {
    notification: {
      title: 'Unblocked user',
      body:`Dear ${parentObj.name},
      Your child ${userObj.name} has unblocked a user.
      
    From, 7Teen`,
    },
    token: parentObj.FCMToken,
  };
  admin
    .messaging()
    .send(message)
    .then(function (response, err) {
      console.log('Notification ID : =>', response);
      if (response) {
        console.log('Notification Send Successfully');
        return;
      } else {
        console.log('Notification not sent', err);
      }
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });
};
const sendApproveNotify = async (userObj) => {
  var message = {
    notification: {
      title: 'Approved Request',
      body: `Dear ${userObj.name},

        Your Account has been approved by your parent.`,
    },
    token: userObj.FCMToken,
  };
  admin
    .messaging()
    .send(message)
    .then(function (response, err) {
      console.log('Notification ID : =>', response);
      if (response) {
        console.log('Notification Send Successfully');
        return;
      } else {
        console.log('Notification not sent', err);
      }
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });
};

/**
 * Send welcome email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendNewConvNotify = async (userObj, FCMToken) => {
  var message = {
    notification: {
      title: `New Friend by ${userObj.name} at 7Teen`,
      body: `Dear ${userObj.parent_name},
        Your child ${userObj.name} is connected with a new Friend.`,
    },
    token: FCMToken,
  };
  admin
    .messaging()
    .send(message)
    .then(function (response, err) {
      console.log('Notification ID : =>', response);
      if (response) {
        console.log('Notification Send Successfully');
        return;
      } else {
        console.log('Notification not sent', err);
      }
    })
    .catch((error) => {
      console.log('Error sending message:', error);
    });
};

module.exports = {
  sendEmail,
  sendWelcomeNotify,
  sendApproveNotify,
  sendNewConvNotify,
  sendUnBlockUserNotification,
  sendBlockUserNotification,
  sendLeftGroupPushNotification,
  sendNewGroupPushNotification

};
