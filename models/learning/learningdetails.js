let mongoose = require("mongoose"),
  Schema = mongoose.Schema,
  mongooseUniqueValidator = require("mongoose-unique-validator"),
  bcrypt = require("bcrypt");
autoIncrement = require("mongoose-sequence")(mongoose);

let LearningDetailsSchema = new Schema(
  {
    _id: { type: Number },
    master_id: { type: Number},
    supervisor_id: { type: Number },
    status: { type: String, default: null },
    measureOfSuccess: { type: String, default: null },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Number, default: null },
    updatedBy: { type: Number, default: null },
    progressStatus: { type: String, default: null },
    developmentArea: { type: String, default: null },
    developmentPlan: { type: String, default: null },
    timelines: { type: String, default: null },
    supportRequired: { type: String, default: null },
    employeeComment: { type: String, default: null },
    supervisorComment: { type: String, default: null }
  },
  {
    timestamps: true,
    versionKey: false,
    _id: false
  }
);

// Update the Emp_id Hash user password when registering or when changing password
LearningDetailsSchema.pre("save", function (next) {
  var _this = this;
  if (_this.isNew) {
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id
    mongoose
      .model("learningDetails", LearningDetailsSchema)
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

LearningDetailsSchema.plugin(mongooseUniqueValidator);

module.exports = mongoose.model("learningDetails", LearningDetailsSchema);
