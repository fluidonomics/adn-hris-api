let mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt = require('bcrypt');
autoIncrement = require('mongoose-sequence')(mongoose);

let EmployeeLeaveBalanceSchema = new Schema({
    _id: { type: Number },
    emp_id: { type: Number, ref: 'employeedetails' },
    leave_type: { type: Number, ref: 'leaveType' },
    lapseDate: { type: Date },
    createdDate: { type: Date },
    updatedDate: { type: Date },
    balance: { type: Number, default: null },
    updatedBy: { type: Number, default: null },
    createdBy: { type: Number, default: null },
    isDeleted: { type: Boolean, default: false }
},
    {
        timestamps: true,
        versionKey: false,
        _id: false
    }
);
EmployeeLeaveBalanceSchema.plugin(mongooseUniqueValidator);

//Perform actions before saving the bank details
EmployeeLeaveBalanceSchema.pre('save', function (next) {
    var _this = this;
    if (_this.isNew) {
        mongoose.model('leavebalance', EmployeeLeaveBalanceSchema).count(function (err, c) {
            _this._id = c + 1;
            next();
        });
    }
});

module.exports = mongoose.model('leavebalance', EmployeeLeaveBalanceSchema, 'leavebalance');