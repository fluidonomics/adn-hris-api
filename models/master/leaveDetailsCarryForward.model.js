let mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  mongooseUniqueValidator = require('mongoose-unique-validator'),
  bcrypt = require('bcrypt');
autoIncrement = require('mongoose-sequence')(mongoose);

let LeaveDetailsCarryForwardSchema = new Schema(
  {
    _id: { type: Number },
    emp_id: { type: Number, ref: 'employeedetails' },
    sickLeavelapsed: { type: Number, default: null },
    annualLeavelapsed: { type: Number, default: null },
    annualLeaveencahsed: { type: Number, default: null },
    annualLeaveCarryForward: { type: Number, default: null },
    fiscalYearId: { type: Number, ref: 'financialYear' },
  },
  {
    timestamps: true,
    versionKey: false,
    _id: false
  });

LeaveDetailsCarryForwardSchema.plugin(mongooseUniqueValidator);

//Perform actions before saving the role
LeaveDetailsCarryForwardSchema.pre('save', function (next) {
  var _this = this;
  if (_this.isNew) {
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
    mongoose.model('leaveDetailsCarryForward', LeaveDetailsCarryForwardSchema).find().sort({ _id: -1 }).limit(1)
      .exec(function (err, doc) {
        if (doc.length > 0) {
          _this._id = doc[0]._id + 1;
          next();
        }
        else {
          _this._id = 1;
          next();
        }
      });
  }
});

module.exports = mongoose.model('leaveDetailsCarryForward', LeaveDetailsCarryForwardSchema);

