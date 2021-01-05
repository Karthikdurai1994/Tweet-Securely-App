const mongoose = require("mongoose");

const adminOperationSchema = new mongoose.Schema({
  tweetID: { type: String, required: true, trim: true },
  status: { type: String, required: true, trim: true },
  updatedTweetMessage: { type: String, trim: true, default: null },
});

const AdminOperation = mongoose.model("AdminOperation", adminOperationSchema);
module.exports = AdminOperation;
