let mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt = require('bcrypt');
autoIncrement = require('mongoose-sequence')(mongoose);

let LeaveAppliedMasterSchema = new Schema({
    _id: { type: Number },
    applyTo: { type: Number, ref: 'employeedetails', default: null },
    cancelLeaveApplyTo: { type: Number, ref: 'employeedetails', default: null },
    createdBy: { type: Number, ref: 'employeedetails', default: null },
    createdAt: { type: Date, default: null },
    days: { type: Number, default: null },
    emp_id: { type: Number, ref: 'employeedetails' },
    fiscalYearId: { type: Number, default: null },
    isDeleted: { type: Boolean, default: false },
    reason: { type: String, default: null },
    reason2: { type: String, default: null },
    status: { type: String, default: null },
    updatedBy: { type: Number, ref: 'employeedetails', default: null },
    updatedAt: { type: Date, default: null },
    fromDate: { type: Date, default: null },
    toDate: { type: Date, default: null },
    leaveapplieddetailsId: { type: Number },
    systemApproved: { type: Boolean, default: false },
    remark: { type: String, default: null },
    leave_type: { type: Number, ref: 'leaveType' },
    attachment: { type: Object, default: null },
    supervisorReason: { type: String, default: null },
    supervisorReason2: { type: String, default: null },
    cancelReason: { type: String, default: null }
},
    {
        timestamps: true,
        versionKey: false,
        _id: false
    }
);
LeaveAppliedMasterSchema.plugin(mongooseUniqueValidator);

//   //Perform actions before saving the bank details
//   LeaveAppliedMasterSchema.pre('save', function (next) {
//     var _this=this;
//     if (_this.isNew) {
//         mongoose.model('leaveapplieddetails', LeaveAppliedMasterSchema).count(function(err, c) {
//               _this._id = c + 1;
//               next();
//         });
//     }
//   });

LeaveAppliedMasterSchema.pre('save', function (next) {
    var _this = this;
    if (_this.isNew) {
        //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
        mongoose.model('leaveappliedmaster', LeaveAppliedMasterSchema).find().sort({ _id: -1 }).limit(1)
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

module.exports = mongoose.model('leaveappliedmaster', LeaveAppliedMasterSchema);