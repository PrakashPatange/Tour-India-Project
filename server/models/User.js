import mongoose from "mongoose";
const { Schema } = mongoose;
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 6,
      max: 64,
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

// Authenticate User
userSchema.statics.findUserByCredentials = async function (email, password) {
  const user = await this.findOne({ email }); // Use 'this' instead of 'User'

  if (!user) {
    throw new Error("User does not exist.");
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    throw new Error("Please enter correct password.");
  }

  return user;
};

// Generate Auth Token
userSchema.methods.generateAuthToken = async function () {
  const token = jwt.sign({ _id: this._id }, process.env.SECRET_KEY, {
    expiresIn: "1h",
  });

  this.tokens = this.tokens.concat({ token });

  await this.save();

  return token;
};

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 9);
  next();
});

const User = mongoose.model("User", userSchema);
export default User;
