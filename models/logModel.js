const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    level: { type: String },
    message: { type: String },
    meta: { type: String },
  },
  { collection: "log" } //setting collection name or else plural of model name will be taken
);

const logs = mongoose.model("Log", logSchema);
module.exports = logs;
