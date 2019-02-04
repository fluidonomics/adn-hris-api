let mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt = require('bcrypt');
autoIncrement = require('mongoose-sequence')(mongoose);

let LeaveMasterDetailsSchema = new Schema({
    _id: { type: Number },
    leaveAppliedId: { type: Number, ref: 'leaveapplieddetails'},
    status: {type: String, default: null},
    updatedBy: { type: Number, ref: 'employeedetails', default: null },
    createdBy: { type: Number, ref: 'employeedetails', default: null },
    isDeleted: { type: Boolean, default: false },
    fiscalYearId: { type: Number, default: null },
},
    {
        timestamps: true,
        versionKey: false,
        _id: false
    }
);
LeaveMasterDetailsSchema.plugin(mongooseUniqueValidator);

LeaveMasterDetailsSchema.pre('save', function (next) {
    var _this = this;
    if (_this.isNew) {
        //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
        mongoose.model('leavemasterdetails', LeaveMasterDetailsSchema).find().sort({ _id: -1 }).limit(1)
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

module.exports = mongoose.model('leavemasterdetails', LeaveMasterDetailsSchema);