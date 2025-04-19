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
    flag: String,
    oldCredits: defaultZeroNumber,
    newRefreshedCredits: defaultZeroNumber,
    allianceLocation: String,
    private: { type: Boolean, default: false },
    markType: String,
  },
  { timestamps: true }
);

const Users = model("brawl_stars_users", schema);

module.exports = Users;
