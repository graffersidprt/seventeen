const express = require('express');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const passport = require('passport');
const http = require('http');
const httpStatus = require('http-status');
const config = require('./config/config');
const morgan = require('./config/morgan');
const { jwtStrategy } = require('./config/passport');

const { authLimiter } = require('./middlewares/rateLimiter');
const socketController = require('./controllers/socketHandler');
const routes = require('./routes/v1');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');

const app = express();
// const server = http.createServer(app);
// const io = socketIo(server);
// eslint-disable-next-line import/order
const serveIndex = require('serve-index');

//app.use('/uploads', express.static('public'), serveIndex('public', { icons: true }));

app.use(express.static(path.join(__dirname, '..', 'public')));

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// enable cors
app.use(cors());
app.options('*', cors());

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/v1/auth', authLimiter);
}

// v1 api routes
app.use('/v1', routes);
// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

// const onConnection = (socket) => {
//   socketController(io, socket);
// };
// io.on('connection', onConnection);

// server.listen(PORT, () => console.log(`Server is running on port: ${PORT}`));
module.exports = app;
