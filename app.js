require("dotenv").config();
const express = require("express");
const logger = require("./config/logger");
const app = express();
const bodyparser = require("body-parser");

//Auth Middleware
const auth = require("./middleware/auth");

const PORT = process.env.PORT || 3000;

//MongoDB Connection
require("./db/mongoose");

//Tweets Model
const Tweets = require("./models/userTweets");

//Log Model
const log = require("./models/logModel");

//User Model
const User = require("./models/user");

//Admin Operation Model
const AdminOperation = require("./models/admin");

// Body-parser middleware
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

//Default API
app.get("", (req, res) => {
  res.send("Welcome!!!");
});

/*---------User API ----------*/
//Create or Sign Up Users
app.post("/user", async (req, res) => {
  const user = new User({
    email: req.body.email,
    password: req.body.password,
  });
  try {
    await user.save();
    const token = await user.generateAuthToken();
    //Storing of Logs
    const status = {
      message: "User with ID: " + user._id + " have SignedUp",
      type: "access",
    };
    logger.info({ data: status });

    res.status(201).send({
      user: user,
      token: token,
    });
  } catch (e) {
    res.status(400).send(e);
  }
});

//Logging in Users
app.post("/user/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    //Storing of Logs
    const status = {
      message: "User with ID: " + user._id + " have LoggedIn",
      type: "access",
    };
    logger.info({ data: status });

    const token = await user.generateAuthToken();
    res.send({
      user: user,
      token: token,
    });
  } catch (e) {
    res.status(400).send();
  }
});

//Logging Out User from the device they are using currently
app.post("/user/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    // //Storing of Logs
    const status = {
      message: "User with ID: " + req.user._id + " have LoggedOut",
      type: "access",
    };
    logger.info({ data: status });

    res.send(JSON.stringify("Logout Success"));
  } catch (e) {
    res.status(500).send();
  }
});

//Logging Out User from all devices they logged in
app.post("/user/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    //Storing of Logs
    const status = {
      message:
        "User with ID: " + req.user._id + " have LoggedOut from all devices",
      type: "access",
    };
    logger.info({ data: status });

    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

//Create Tweet API
app.post("/createTweet", auth, async (req, res) => {
  try {
    const tweet = new Tweets({
      tweet: req.body.tweetMessage,
      owner: req.user._id,
    });
    await tweet.save();
    //Storing of Logs
    const status = {
      message: "Tweet was created by user of ID: " + req.user._id,
      type: "action",
    };
    logger.info({ data: status });

    res.status(201).send(tweet);
  } catch (e) {
    res.send(e);
  }
});

//Reading All Tweets
app.get("/fetchAllTweets", auth, async (req, res) => {
  //Performing with async and await
  var tweetArray = [];
  try {
    const tweets = await Tweets.find({ owner: req.user._id });
    // console.log(tweets.tweet);
    tweets.forEach((t) => {
      tweetArray.push({ tweet: t.tweet, uploadDate: t.created_at });
    });
    console.log(tweetArray);
    //Storing of Logs
    const status = {
      message: "User with ID: " + req.user._id + " have fetched tweets",
      type: "action",
    };
    logger.info({ data: status });

    res.send({
      Tweets: tweetArray,
    });
  } catch (e) {
    res.status(500).send(e);
  }
});

//Deleting Tweet
app.delete("/deleteTweet/:id", auth, async (req, res) => {
  const id = req.params.id;
  try {
    const tweet = await Tweets.findOneAndDelete({
      _id: id,
      owner: req.user._id,
    });
    if (!tweet) {
      return res.status(404).send();
    }
    //Storing of Logs
    const status = {
      message:
        "User with ID: " + req.user._id + " deleted tweet with ID: " + id,
      type: "audit",
    };
    logger.info({ data: status });

    res.send("Tweet Deleted Successfully!!!");
  } catch (e) {
    res.status(500).send(e);
  }
});
/*---------End of User API ----------*/

/*---------Admin API ----------*/
//Admin API for performing operations on behalf of user
app.post("/adminOperation", async (req, res) => {
  try {
    const adminOperation = new AdminOperation({
      tweetID: req.body.tweetID,
      status: req.body.status,
      updatedTweetMessage: req.body.newTweetMessage,
    });
    await adminOperation.save();
    //Storing of Logs
    const status = {
      message:
        "Admin has requested " +
        req.body.status +
        " of tweet with ID: " +
        req.body.tweetID,
      type: "audit",
    };
    logger.info({ data: status });

    res.send(adminOperation);
  } catch (e) {
    res.status(400).send(e);
  }
});

//Admin Reading All Tweets of the User
app.get("/fetchAllTweetsOfUser", async (req, res) => {
  //Performing with async and await
  try {
    const tweets = await Tweets.find({});
    //Storing of Logs
    const status = {
      message: "Admin has read all tweets of users",
      type: "action",
    };
    logger.info({ data: status });

    res.send(tweets);
  } catch (e) {
    res.status(500).send(e);
  }
});

/*---------End of Admin API ----------*/

/*---------Super-Admin API ----------*/
//Complete Admin's Request
app.get("/completeAdminRequest", async (req, res) => {
  try {
    var adminRequest = await AdminOperation.find({});

    adminRequest.forEach(async (r) => {
      let tweetID = r.tweetID;
      let status = r.status;
      let newTweetMessage = r.updatedTweetMessage;
      const t = await Tweets.findOne({ _id: tweetID });
      if (status === "update") {
        t.tweet = newTweetMessage;
        await t.save();
      } else if (status === "delete") {
        const deletedTweet = await Tweets.findOneAndDelete({ _id: tweetID });
      }
      const deleteAdminRequest = await AdminOperation.findOneAndDelete({
        _id: r._id,
      });
    });

    //Storing of Logs
    const status = {
      message: "Super Admin has approved the request of Admin",
      type: "audit",
    };
    logger.info({ data: status });

    res.send("Completed Admin Request Successfully");
  } catch (e) {
    res.status(500).send(e);
  }
});

//View Logs
app.post("/viewLogs", async (req, res) => {
  const logType = req.body.logType;
  try {
    const logs = await log.find({});
    logs.map((data) => {
      data.message = data.message.replace(/\n/g, "");
    });
    res.send(logs);
  } catch (e) {
    res.status(500).send(e);
  }
});

/*---------End of Super-Admin API ----------*/

app.listen(PORT, () => {
  const status = { message: "Server Started", type: "audit" };
  console.log("Server is listening on PORT: " + PORT);
  logger.info({ data: status });
});
