var Conversation = require("../model/Conversation");
var Users = require("../model/userModel");
var aUsers = require("../model/adminuserModel");

const Notifications = require("../services/notification");
const Message = require("../model/messageModel");

exports.getConversationAdmin = async (req, res) => {
  try {
    const admin = await aUsers.findOne();
    return res.json({
      status: "succes",
      message: "admin data",
      data: admin,
    });
  } catch (error) {
    return res.json({
      status: "failed",
      message: "Content can not be emtpy!",
      data: error,
    });
  }
};

exports.newConversation = async (req, res) => {
  try {
    let members = req.body.members;
    let room = req.body.room;
    if (Object.keys(req.body).length === 0) {
      res.status(400);

      res.json({
        status: "failed",
        message: "Content can not be emtpy!",
        data: "",
      });
      return;
    }
    if (req.query.isAdmin) {
      const admin = await aUsers.findOne();

      members.push({ user_type: "admin", id: admin._id.toString() });

      // const io = req.app.io

      // io.emit("notification", {});
    }

    var is_conversation = 0;
    var id_s = [];
    await members.map((u) => {
      //var jobQueries = [];
      id_s.push(u.id);
    });

    let conv_data = await Conversation.find({
      $and: [{ "members.id": { $all: id_s } }, { room_name: room }],
    });
    //console.log(conv_data);
    if (conv_data.length == 0) {
      const saveData = {};
      saveData["room_name"] = room;
      saveData["members"] = members;

      if (req.query.teamId) saveData["teamId"] = req.query.teamId;
      const conv = new Conversation(saveData);
      conv
        .save(conv)
        .then(async (data) => {
          const ids = conv.members
            .map((x) => x.id)
            .filter((y) => JSON.stringify(req.user._id) != JSON.stringify(y));

          if (room == "") {
            const data = {
              room_name: conv._id,
            };
            Conversation.findByIdAndUpdate(conv._id, data, (err, cov) => {
              if (err) {
                console.log(err);
              } else {
                console.log("else");
              }
            });
          }

          if (req.query.isAdmin) {
            const io = req.app.io;

            const adminUser = await aUsers.findOne();
            const notification = {
              message: `${req.user.fullname} wants to chat with you.`,
              redirect_to: "chat",
              data: { _id: req.user._id },
            };
            io.emit("notification", notification);

            aUsers.updateMany(
              { _id: adminUser._id },
              { $push: { notification: notification } },
              (err, cov) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log(cov.result);
                }
              }
            );
          }
          const notification = {
            message: `${req.user.fullname} wants to chat with you.`,
            redirect_to: "chat",
            data: { _id: req.user._id, key_1: "new_chat", covoId: conv._id },
          };
          Notifications.sendNotification(
            {
              title: "New chat Started",
              body: `${req.user.fullname} wants to chat with you.`,
              data: { key_1: "new_chat", covoId: conv._id },
            },
            ids
          );

          const user = Users.updateMany(
            { _id: ids },
            { $push: { notification: notification } },
            (err, cov) => {
              if (err) {
                console.log(err);
              } else {
                console.log(cov.result);
              }
            }
          );

          res.json({
            status: "success",
            message: "Conversation Started.",
            data: conv._id,
          });
        })
        .catch((err) => {
          res.status(400);
          res.json({
            status: "failed",
            message:
              err.message ||
              "Some error occurred while creating a create operation",
            data: "",
          });
        });
    } else {
      // console.log(conv_data);
      res.json({
        status: "success",
        message: "Conversation Started.",
        data: conv_data[0]._id,
      });
    }
  } catch (error) {
    console.log("====================================");
    console.log(error);
    console.log("====================================");
    return res.status(400).json({
      status: "failed",
      message: error,
      data: "",
    });
  }
};

exports.createEventChat = async (req, res) => {
  try {
    const eventId = req.params.eventId;

    const event = await Events.findById(eventId);

    if (!event) throw new Error("event not found");

    const members = event.invitations
      .filter((x) => x.status === "accepted")
      .map((x) => ({ user_type: "user", id: x.recevier_id }));
    members.push({ user_type: "user", id: event.user_id });
    let conv_data = await Conversation.findOne({ event: eventId });
    if (!conv_data) {
      const conv = new Conversation({
        room_name: event.name,
        members: members,
        event: eventId,
      });

      const saveData = await conv.save();
      return res.json({
        status: "success",
        message: "Conversation Started.",
        data: saveData,
      });
    }

    conv_data.members = members;
    const saveData = await conv_data.save();
    return res.json({
      status: "success",
      message: "Conversation Started.",
      data: saveData,
    });
  } catch (error) {
    return res.status(400).json({
      status: "failed",
      message: error,
      data: "",
    });
  }
};

exports.deleteConversationByTeam = async (req, res) => {
  try {
    const convoId = req.params.id;

    const conversation = await Conversation.findById(convoId).populate(
      "teamId"
    );

    if (conversation.teamId.created_by !== req.user._id)
      throw new Error("You are not admin");

    const message = await Message.deleteMany({ conversationId: convoId });

    return res.json({
      status: "success",
      message: conversation,
      data: conversation,
    });
  } catch (error) {
    return res.status(400).json({
      status: "failed",
      message: error,
      data: "",
    });
  }
};

exports.getConversationByUser = async (req, res) => {
  let user_id = req.params.user_id;
  try {
    Conversation.find({
      members: {
        $elemMatch: { id: user_id.toString(), user_type: { $eq: "user" } },
      },
    })
      .sort({ last_msg_time: "desc" })
      .exec()
      .then(function (conv_data) {
        var jobQueries = [];
        if (conv_data.length) {
          conv_data.forEach(function (u) {
            u.members.map(async (m) => {
              if (m.user_type === "user") {
                if (m.id !== user_id) {
                  let user = Users.findOne(
                    { _id: m.id.toString() },
                    "fullname profile_pic"
                  )
                    .populate("favorite_sports.sport_id")
                    .lean();

                  if (user) {
                    jobQueries.push(user);
                  }
                }
              } else {
                let user = aUsers
                  .findOne({ _id: m.id.toString() }, "first_name profile_pic")
                  .lean();

                console.log(user);

                if (user) {
                  jobQueries.push(user);
                }
              }
            });
          });
        }
        return Promise.all(jobQueries);
      })
      .then(async function (listOfJobs) {
        await Conversation.find({
          members: {
            $elemMatch: { id: user_id.toString(), user_type: { $eq: "user" } },
          },
        })
          .sort({ last_msg_time: "desc" })
          .lean()
          .exec(function (err, conv_d) {
            let k = 0;
            if (conv_d) {
              conv_d.forEach((element) => {
                //sports1[k].user_name = 'abc 11';

                if (listOfJobs[k]) {
                  if (listOfJobs[k].fullname) {
                    var profile_img = listOfJobs[k].profile_pic;
                    //profile_img = profile_img.substring(profile_img.indexOf("\\") + 1);
                    profile_img = process.env.CLIENT_URL + "/" + profile_img;
                    conv_d[k].conv_user_id = listOfJobs[k]._id;
                    conv_d[k].conv_user_name = listOfJobs[k].fullname;
                    conv_d[k].conv_user_profile_pic = profile_img;
                    conv_d[k].conv_user_fav_sports =
                      listOfJobs[k].favorite_sports;
                  } else {
                    var profile_img = listOfJobs[k].profile_pic;
                    //profile_img = profile_img.substring(profile_img.indexOf("\\") + 1);
                    profile_img = process.env.CLIENT_URL + "/" + profile_img;
                    conv_d[k].conv_user_id = listOfJobs[k]._id;
                    conv_d[k].conv_user_name = listOfJobs[k].first_name;
                    conv_d[k].conv_user_profile_pic = profile_img;
                  }
                }
                k++;
              });
            }

            const conv_data = conv_d.map((x) => {
              if (x.room_name) return { ...x, type: "team" };
              if (x.members.length > 0) {
                if (
                  x.members.filter(({ id }) => id != req.user._id)[0]
                    .user_type === "admin"
                ) {
                  return { ...x, type: "dudi" };
                }

                if (
                  req.user.friends.includes(
                    x.members
                      .filter(({ id }) => id != req.user._id)
                      .map((x) => x.id)[0]
                  )
                ) {
                  return { ...x, type: "dudi" };
                } else return { ...x, type: "request" };
              }
            });

            res.json({
              status: "success",
              message: "",
              data: conv_data,
            });
          });
      });
  } catch (error) {
    return res.status(400).json({
      status: "failed",
      message: error,
      data: "",
    });
  }
};

exports.getConversationOfTwoUser = async (req, res) => {
  let first_user_id = req.params.firstUserId;
  let second_user_id = req.params.secondUserId;
  try {
    const conversation = await Conversation.findOne({
      members: { $all: [first_user_id, second_user_id] },
    });
    res.json({
      status: "success",
      message: "",
      data: conversation,
    });
  } catch (err) {
    return res.status(400).json({
      status: "failed",
      message: err,
      data: "",
    });
  }
};

exports.searchByUserName = async (req, res) => {
  try {
    let search_text = req.body.search_text;
    console.log(search_text);
    Conversation.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "members.id",
          foreignField: "_id",
          as: "userObj",
        },
      },
    ])
      .match({ "userObj.fullname": "mhr" })
      .exec((err, conversations) => {
        if (err) {
          console.log(err);
          return res.status(400).json({
            status: "failed",
            message: error,
            data: err,
          });
        } else {
          res.json({
            status: "success",
            message: "",
            data: conversations,
          });
        }
      });
  } catch (err) {
    return res.status(400).json({
      status: "failed",
      message: error,
      data: "",
    });
  }
};
