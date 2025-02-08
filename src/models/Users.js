const { Schema, model } = require("mongoose");

const requiredString = { type: String, required: true };
const requiredUniqueString = { ...requiredString, unique: true };
const defaultZeroNumber = { type: Number, default: 0 };

const schema = new Schema(
  {
    userId: requiredString,
    brawlStarsTag: requiredUniqueString,
    brawlStarsUsername: requiredString,
    trophies: defaultZeroNumber,
    credits: defaultZeroNumber,
  },
  { timestamps: true }
);

const Users = model("brawl_stars_users", schema);

module.exports = Users;
