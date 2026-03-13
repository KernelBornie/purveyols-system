const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: [
      "admin",
      "director",
      "engineer",
      "foreman",
      "accountant",
      "driver",
      "procurement",
      "safety"
    ],
    default: "engineer"
  },

  isActive: {
    type: Boolean,
    default: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

/* hash password */
UserSchema.pre("save", async function () {

  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);

  this.password = await bcrypt.hash(this.password, salt);

});

/* compare password */
UserSchema.methods.comparePassword = async function (password) {

  return await bcrypt.compare(password, this.password);

};

module.exports =
  mongoose.models.User || mongoose.model("User", UserSchema);