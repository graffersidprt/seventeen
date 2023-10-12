

 const RoomModel = require('../models/rooms.model');
const UserModel = require('../models/user.model');
const OnlineUserModel = require('../models/onlineUsers.model');
const mongoose = require('mongoose');
const { writeFile } = require('fs');
var path = require('path');

 
module.exports = (io, socket) => {
  const userAdded = async ({ userId }) => {       
    // eslint-disable-next-line no-console
    console.log("userId",userId);
    const findExsitRoom = await OnlineUserModel.findOne({ userId }).lean();
    if (findExsitRoom !== null) {
      await OnlineUserModel.updateOne({ userId },{$set:{
        socketId: socket.id,
       isOnline:true
      }})
      // await UserModel.updateOne({ _id:userId },{$set:{
      //   isOnline:true
      // }})
     console.log("already exist");  
    } else {
      const room = await OnlineUserModel.create({ userId, socketId: socket.id });
      await UserModel.updateOne({ _id:userId },{$set:{
        isOnline:true
      }})
      console.log("room",room);
      
    }
   // const room = await OnlineUserModel.create({  socketId: socket.id });  q
  };
  // import { writeFile } from "fs";

  const sendMessage = async ({message, senderId, reciverId,file}) => {
    console.log("message, senderId, reciverId",message, senderId, reciverId);
    // eslint-disable-next-line no-console
    try {
      let obj ={
        message,file  
      }
      const data = await OnlineUserModel.findOne({ userId: mongoose.Types.ObjectId(reciverId) }).lean();
      if (data !== null) {
        // console.log("data",data,obj);
        // console.log("data.socketId",data.socketId);
        // console.log("message",message);
      //  socket.to(data.socketId).emit('msg-recieve', message);
      io.to(data.socketId).emit('NEW_MESSAGE', {message,file}); 
      }
    } catch (error) {
      console.log("error in catch",error);
    }
  };
  const sendFile = async ({file,fileName}) => {
   
    try {
      writeFile(path.join(__dirname,'..',fileName), file, (err) => {
        console.log(err);
       });
    } catch (error) {
      console.log("error in catch",error);
    }
  };
  const messageInGroup = async (message, roomId) => {
    // eslint-disable-next-line no-console
    try {
    
      if (roomId !== null) {
        socket.join(roomId);
        io.to(roomId).emit('GROUP_NEW_MESSAGE', message);
      
      }
    } catch (error) {
     console.log("error in catch",error);
    }
  };
  const disconnect = async (userId) => {
    // eslint-disable-next-line no-console
  console.log("userId in disconnect",userId);
    await UserModel.updateOne({ _id: mongoose.Types.ObjectId(userId) },{$set:{
      isOnline:false
    }})
  
    const deleteRoom = await OnlineUserModel.deleteOne({ userId:mongoose.Types.ObjectId(userId) });
    socket.disconnect()
    console.log('user disconnected',deleteRoom);
  };
  socket.on('USER_ADDED', userAdded);  
  socket.on('NEW_MESSAGE', sendMessage);
  socket.on('GROUP_MESSAGE', messageInGroup);
  socket.on('SEND_FILE', sendFile);
  socket.on('DISCONNECTED', disconnect);
};

// const { addUser, removeUser, getAllUsersInRoom, getUser } = require('../users');

// module.exports = (io, socket) => {
//   const userAdded = ({ name, room }, callback) => {
//     // eslint-disable-next-line no-console
//     console.log(' name, room :', name, room);
//     const { err, user } = addUser({ id: socket.id, name, room });
//     if (err) {
//       return callback(err);
//     }

//     socket.emit('MESSAGE', { user: 'admin', text: `Welcome to the room, ${user.name}!!` });
//     socket.broadcast.to(user.room).emit('MESSAGE', { user: 'admin', text: `${user.name} has joined the chat!` });
//     socket.join(user.room);

//     io.to(user.room).emit('ROOM_DATA', { room: user.room, users: getAllUsersInRoom(user.room) });

//     callback();
//   };
//   const sendMessage = async (message, callback) => {
//     // eslint-disable-next-line no-console
//     console.log('message', message);
//     const user = getUser(socket.id);
//     io.to(user.room).emit('MESSAGE', { user: user.name, text: message });
//     // io.to(user.room).emit('ROOM_DATA', { room: user.room, users: getAllUsersInRoom(user.room)});
//     callback();
//   };
//   const disconnect = () => {
//     const user = removeUser(socket.id);
//     // eslint-disable-next-line no-console
//     console.log(`User with id ${user.name} has disconnected`);
//     if (user) {
//       io.to(user.room).emit('MESSAGE', { user: 'admin', text: `${user.name} has left the chat!` });
//       io.to(user.room).emit('ROOM_DATA', { room: user.room, users: getAllUsersInRoom(user.room) });
//     }
//   };
//   socket.on('USER_ADDED', userAdded);
//   socket.on('NEW_MESSAGE', sendMessage);
//   socket.on('disconnect', disconnect);
// };

// const RoomModel = require('../models/rooms.model');
// const UserModel = require('../models//user.model');
// const mongoose = require('mongoose');
// module.exports = (io, socket) => {
//   const userAddedToROoom = async ({ senderId, reciverId }, callback) => {
//     // eslint-disable-next-line no-console
//     const roomId = Math.random().toString(16).substr(2, 8); // 6de5ccda
//     console.log('rand :', roomId);
//     console.log(' name, room :', senderId, reciverId);
//     const findExsitRoom = await RoomModel.findOne({ senderId, reciverId }).lean();
//     console.log(' findExsitRoom', findExsitRoom);
//     if (findExsitRoom !== null) {
//       socket.join(findExsitRoom.roomId);
//       callback();
//     } else {
//       const room = await RoomModel.create({ senderId, reciverId, roomId });
//       socket.join(room.roomId);
//       callback();
//     }
//   };

//   const sendMessage = async (message, senderId, reciverId, callback) => {
//     // eslint-disable-next-line no-console
//     console.log('message', message);
//     try {
//       const findRoom = await RoomModel.findOne({ senderId, reciverId }).lean();
//       console.log(' findRoom', findRoom);
//       if (findRoom !== null) {
//         io.to(findRoom.roomId).emit('MESSAGE', { text: message });
//         callback();
//       }
//     } catch (error) {
//       callback(error);
//     }
//   };
//   const disconnect = async (userId) => {
//     // eslint-disable-next-line no-console
//     const deleteRoom = await RoomModel.deleteAll({ senderId: mongoose.Types.ObjectId(userId) });
//     console.log(' user disconnected');
//   };
//   socket.on('USER_ADDED', userAddedToROoom);
//   socket.on('NEW_MESSAGE', sendMessage);
//   socket.on('disconnect', disconnect);
// };
