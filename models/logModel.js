const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    level: { type: String },
    message: { type: String },
    meta: { type: String },
  },
  { collection: "log" }
);

const logs = mongoose.model("Log", logSchema);
module.exports = logs;
