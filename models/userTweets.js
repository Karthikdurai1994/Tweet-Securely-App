const mongoose = require("mongoose");

const tweetsSchema = new mongoose.Schema({
  tweet: {
    type: String,
    required: true,
    trim: true,
  },
  created_at: { type: Date, default: Date.now },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
});

const Tweets = mongoose.model("Tweets", tweetsSchema);
module.exports = Tweets;
