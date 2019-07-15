let mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  mongooseUniqueValidator = require('mongoose-unique-validator'),
  bcrypt = require('bcrypt');
autoIncrement = require('mongoose-sequence')(mongoose);

let EmployeeLeaveBalanceSchema = new Schema({
  _id: { type: Number },
  emp_id: { type: Number, ref: 'employeedetails' },
  leave_type: { type: Number, ref: 'leaveType' },
  balance: { type: Number, default: null },
  carryForwardLeave: { type: Number, default: null },
  encahsedLeave: { type: Number, default: null },
  balance: { type: Number, default: null },
  updatedBy: { type: Number, default: null },
  createdBy: { type: Number, default: null },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  isDeleted: { type: Boolean, default: false },
  fiscalYearId: { type: Number, ref: 'financialYear' },
  paid: { type: Number, default: null },
  unpaid: { type: Number, default: null },
  isAvailed: { type: Boolean, default: false }
},
  {
    timestamps: true,
    versionKey: false,
    _id: false
  }
);
EmployeeLeaveBalanceSchema.plugin(mongooseUniqueValidator);

//Perform actions before saving the bank details
// EmployeeLeaveBalanceSchema.pre('save', function (next) {
//     var _this = this;
//     if (_this.isNew) {
//         mongoose.model('leavebalance', EmployeeLeaveBalanceSchema).count(function (err, c) {
//             _this._id = c + 1;
//             next();
//         });
//     }
// });
EmployeeLeaveBalanceSchema.pre('save', function (next) {
  var _this = this;
  if (_this.isNew) {
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
    mongoose.model('leavebalance', EmployeeLeaveBalanceSchema).find().sort({ _id: -1 }).limit(1)
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
module.exports = mongoose.model('leavebalance', EmployeeLeaveBalanceSchema, 'leavebalance');