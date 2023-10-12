const httpStatus = require('http-status');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {

  if (await User.isPhoneTaken(userBody.phone)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'The Phone number already exists, please try another number');
  }
  return User.create(userBody);
};


const createParent = async (data) => {
  if (await User.isPhoneTaken(data.phone)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'The Phone number already exists, please try another number for parent creation');
  }
  return User.create(data);
};
/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return User.findById(id);
};

/**
 * Get user by phone
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByPhone = async (phone) => {
  return User.findOne({ phone:phone });
};

/**
 * Get parent by phone
 * @param {string} email
 * @returns {Promise<User>}
 */
 const getParentByPhone = async (phone) => {
  return User.findOne({ phone:phone,role:'parent' });
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
 console.log("child="+userId);
  const user = await getUserById(userId);
 // console.log(user);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if(user.role == 'user')
  {

    var parent_name=updateBody.parent_name;
    var parent_number=updateBody.parent_number;
    var parent_username=updateBody.parent_username;
    
    /*if (updateBody.parent_username && updateBody.parent_number) {
      updateBody.parent_username = parent_name.substring(0, 4)+""+parent_number.substr(parent_number.length - 4);
    
    }*/

  }
  

  Object.assign(user, updateBody);
  await user.save();
  
  return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.remove();
  return user;
};

/**
 * getChilds
 * @param {string} email
 * @returns {Promise<User>}
 */
 const getChilds = async (userId) => {
  const user = await getUserById(userId);
  //console.log(user);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  return User.find({ parent_number:user.phone });
};


const updateImageById = async (userId, imgPath) => {
 
  console.log(userId);
  const user = await getUserById(userId);
  console.log(user);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  var user_image_path=imgPath;
  
  Object.assign(user, {user_image_path:user_image_path});
  await user.save();
  
  return user;
};


module.exports = {
  createUser,
  queryUsers,
  getUserById,
  updateUserById,
  deleteUserById,
  getUserByPhone,
  getChilds,
  createParent,
  updateImageById,
  getParentByPhone,
};
