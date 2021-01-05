//MongoDB Connection Steps
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_PATH, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});
