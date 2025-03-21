const { Schema, model } = require("mongoose");

const requiredString = { type: String, required: true };
const defaultZeroNumber = { type: Number, default: 0 };

const schema = new Schema(
  {
    // userId: String,
    username: requiredString,
    superCellId: String,
    brawlStarsTag: requiredString,
    brawlStarsUsername: requiredString,
    trophies: defaultZeroNumber,
    credits: defaultZeroNumber,
    private: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Users = model("brawl_stars_users", schema);

module.exports = Users;
