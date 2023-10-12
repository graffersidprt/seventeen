const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const messageRoute = require('./message.route');
const groupRoute = require('./group,route');
const docsRoute = require('./docs.route');
const config = require('../../config/config');
const callingHiostory = require('./callhistory.route');
const conversation = require('./conversation.route');
const notification = require('./notification.route');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/notification',
    route: notification,
  },
  {
    path: '/message',
    route: messageRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/group',
    route: groupRoute,
  },
  {
    path: '/callhistory',
    route: callingHiostory,
  },
  {
    path: '/conversation',
    route: conversation,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;
