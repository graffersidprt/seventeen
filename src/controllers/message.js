var message = require("../model/messageModel");
var Users = require("../model/userModel");
var aUsers = require("../model/adminuserModel");
var Conversation = require("../model/Conversation");
exports.newMessageAdd = async (req, res) => {
  try {
    if (Object.keys(req.body).length === 0) {
      res.status(400);

      res.json({
        status: "failed",
        message: "Content can not be emtpy!",
        data: "",
      });
      return;
    }
    const chat = new message({
      conversationId: req.body.conversationId,
      user_type: req.body.user_type,
      sender: req.body.sender,
      text: req.body.message,
    });
    await chat
      .save()
      .then(async (data) => {
        //res.send(data)
        const conv_data = {
          last_msg_time: new Date(),
          last_msg_text: chat.text,
        };
        await Conversation.findByIdAndUpdate(
          req.body.conversationId,
          conv_data,
          (err, cov) => {
            if (err) {
              console.log(err);
            } else {
              console.log("else");
            }
          }
        );
        res.json({
          status: "success",
          message: "Chat Added",
          data: chat,
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
  } catch (error) {
    return res.status(400).json({
      status: "failed",
      message: error,
      data: "",
    });
  }
};
exports.getMessages = async (req, res) => {
  try {
    let conversationId = req.params.conversationId;

    //
    //message.find({conversationId: conversationId}).exec().then(function(conv_data) {
    message
      .find({
        $and: [{ conversationId: conversationId }, { is_deleted: false }],
      })
      .exec()
      .then(function (conv_data) {
        var jobQueries = [];
        if (conv_data) {
          conv_data.forEach(function (u) {
            if (u.user_type === "user") {
              let user = Users.findOne(
                { _id: u.sender.toString() },
                "username profile_pic"
              ).lean();

              if (user) {
                jobQueries.push(user);
              }
            } else {
              let user = aUsers
                .findOne({ _id: u.sender.toString() }, "first_name profile_pic")
                .lean();

              if (user) {
                jobQueries.push(user);
              }
            }
          });
        }
        return Promise.all(jobQueries);
      })
      .then(async function (listOfJobs) {
        //await message.find({conversationId: conversationId}).lean().exec(function (err, conv_d) {
        await message
          .find({
            $and: [{ conversationId: conversationId }, { is_deleted: false }],
          })
          .lean()
          .exec(function async(err, conv_d) {
            let k = 0;
            if (conv_d) {
              conv_d.forEach((element) => {
                //sports1[k].user_name = 'abc 11';
                console.log(listOfJobs);
                if (listOfJobs[k].username) {
                  var profile_img = listOfJobs[k].profile_pic;
                  if (profile_img !== "") {
                    profile_img = profile_img.substring(
                      profile_img.indexOf("/") + 1
                    );
                    profile_img = process.env.CLIENT_URL + "/" + profile_img;
                  } else {
                    profile_img =
                      process.env.CLIENT_URL + "/images/user_placeholder.png";
                  }

                  conv_d[k].conv_user_id = listOfJobs[k]._id;
                  conv_d[k].conv_user_name = listOfJobs[k].username;
                  conv_d[k].conv_user_profile_pic = profile_img;
                } else {
                  //var profile_img = listOfJobs[k].profile_pic;
                  //profile_img = profile_img.substring(str.indexOf("\\") + 1);
                  var profile_img = listOfJobs[k].profile_pic;
                  if (profile_img !== "") {
                    profile_img = process.env.CLIENT_URL + "/" + profile_img;
                  } else {
                    profile_img =
                      process.env.CLIENT_URL + "/images/user_placeholder.png";
                  }

                  conv_d[k].conv_user_id = listOfJobs[k]._id;
                  conv_d[k].conv_user_name = listOfJobs[k].first_name;
                  conv_d[k].conv_user_profile_pic = profile_img;
                }

                k++;
              });
            }

            Conversation.findById(conversationId)
              .populate("teamId")
              .then(async (data) => {
                if (!data.room_name) {
                  const userId = data.members.filter(
                    (x) => JSON.stringify(x.id) !== JSON.stringify(req.user._id)
                  )[0].id;

                  const username = await Users.findById(userId);

                  return res.json({
                    status: "success",
                    message: "",
                    data: conv_d,
                    header: username?.username || "Admin",
                    conversation: data,
                  });
                }

                return res.json({
                  status: "success",
                  message: "hhjbbh",
                  data: conv_d,
                  header: data.room_name,
                  conversation: data,
                });
              });
          });
      })
      .catch(function (error) {
        return res.status(400).json({
          status: "failed",
          message: error,
          data: "fdfd",
        });
        //res.status(500).send('one of the queries failed', error);
      });
  } catch (error) {
    return res.status(400).json({
      status: "failed",
      message: error,
      data: "",
    });
  }
};
exports.deleteMessages = async (req, res) => {
  try {
    let messageId = req.params.id;
    const data = {
      is_deleted: true,
    };
    message.findByIdAndUpdate(messageId, data, (err, msg) => {
      if (err) {
        console.log(err);
        return res.status(400).json({
          status: "failed",
          message: "Something went wrong",
          data: "",
        });
      } else {
        return res.status(200).json({
          status: "success",
          message: "Message deleted.",
          data: "",
        });
      }
    });
  } catch (error) {
    return res.status(400).json({
      status: "failed",
      message: error,
      data: "",
    });
  }
};
