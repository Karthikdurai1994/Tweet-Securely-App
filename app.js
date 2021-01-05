require("dotenv").config();
const express = require("express");
const app = express();
const bodyparser = require("body-parser");

//Auth Middleware
const auth = require("./middleware/auth");

const PORT = process.env.PORT || 3000;

//MongoDB Connection
require("./db/mongoose");

//Tweets Model
const Tweets = require("./models/userTweets");

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
    res.send("Completed Admin Request Successfully");
  } catch (e) {
    res.status(500).send(e);
  }
});

/*---------End of Super-Admin API ----------*/

app.listen(PORT, () => {
  console.log("Server is listening on PORT: " + PORT);
});
