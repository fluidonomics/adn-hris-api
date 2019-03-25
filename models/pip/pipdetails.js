let mongoose = require("mongoose"),
  Schema = mongoose.Schema,
  mongooseUniqueValidator = require("mongoose-unique-validator"),
  bcrypt = require("bcrypt");
autoIncrement = require("mongoose-sequence")(mongoose);

let pipDetailsSchema = new Schema(
  {
    _id: { type: Number },
    master_id: { type: Number },
    supervisor_id: { type: Number },
    status: { type: String, default: "Initiated" },
    areaofImprovement: { type: String, default: null },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Number, default: null },
    updatedBy: { type: Number, default: null },
    actionPlan: { type: String, default: null },
    finalReview: { type: String, default: null },
    finalRating: { type: Number, default: null },
    timelines: { type: Number, default: null },
    approvedAt: {type: Date, default: null },
    measureOfSuccess: { type: String, default: null },
    employeeInitialComment: { type: String, default: null },
    superviserInitialComment: { type: String, default: null },
    empComment_month1: { type: String, default: null },
    supComment_month1: { type: String, default: null },
    empComment_month2: { type: String, default: null },
    supComment_month2: { type: String, default: null },
    empComment_month3: { type: String, default: null },
    supComment_month3: { type: String, default: null },
    empComment_month4: { type: String, default: null },
    supComment_month4: { type: String, default: null },
    empComment_month5: { type: String, default: null },
    supComment_month5: { type: String, default: null },
    empComment_month6: { type: String, default: null },
    supComment_month6: { type: String, default: null },
    fiscalYearId: { type: Number, default: null }
     },
  {
    timestamps: true,
    versionKey: false,
    _id: false
  }
);

// Update the Emp_id Hash user password when registering or when changing password
pipDetailsSchema.pre("save", function (next) {
  var _this = this;
  if (_this.isNew) {
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id
    mongoose
      .model("pipDetails", pipDetailsSchema)
      .find()
      .sort({ _id: -1 })
      .limit(1)
      .exec(function (err, doc) {
        if (doc.length > 0) {
          _this._id = doc[0]._id + 1;
          next();
        } else {
          _this._id = 1;
          next();
        }
      });
  }
});

pipDetailsSchema.plugin(mongooseUniqueValidator);

module.exports = mongoose.model("pipDetails", pipDetailsSchema);