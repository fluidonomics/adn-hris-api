let mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt = require('bcrypt');
autoIncrement = require('mongoose-sequence')(mongoose);

let LeaveWorkflowHistorySchema = new Schema({
    _id: { type: Number },
    appliedLeaveId: { type: Number },
    emp_id: { type: Number, default: null },
    Owner: { type: Number, default: null },
    updatedAt: { type: Date, default: null },
    Step: { type: String, default: null }, //(Type of transaction or action done on leave eg - applied, canceled, Accepted, Review, Rejected, Forwarded)
    Status: { type: String, default: null },
    isDeleted: { type: Boolean, default: null },
},
    {
        timestamps: true,
        versionKey: false,
        _id: false
    }
);
LeaveWorkflowHistorySchema.plugin(mongooseUniqueValidator);

//Perform actions before saving the bank details
// LeaveWorkflowHistorySchema.pre('save', function (next) {
//     var _this = this;
//     if (_this.isNew) {
//         mongoose.model('leaveworkflowhistory', LeaveWorkflowHistorySchema).count(function (err, c) {
//             _this._id = c + 1;
//             next();
//         });
//     }
// });

module.exports = mongoose.model('leaveworkflowhistory', LeaveWorkflowHistorySchema, 'leaveworkflowhistory');