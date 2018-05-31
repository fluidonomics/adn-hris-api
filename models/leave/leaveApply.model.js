let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

    let LeaveAppliedDetailsSchema = new Schema({
        _id: {type:Number},
        emp_id:{type: Number,ref:'employeedetails'},
        leave_type: {type:Number, ref:'leaveType'},
        fromDate: {type:Date, default:null},
        toDate: {type:Date, default:null},
        days: {type:Number, default: null},
        applyTo: {type:Number, ref: 'employeedetails', default: null},
        reason: {type:String, default: null},
        status: {type: String, default: null},
        contactDetails: {type: String, default:null},
        attachment: {type:Object, default: null},
        ccTo: {type: String, default:null},
        isApproved: {type:Boolean, default:null},
        isCancelled: {type:Boolean, default:null},
        cancelReason: {type: String, default: null},
        cancelLeaveApplyTo: {type: Number, ref:'employeedetails', default:null},
        remark: {type:String, default: null},
        forwardTo: {type: String, default: null},
        updatedBy:{type:Number,default:null},
        createdBy:{type:Number,default:null},
        isDeleted:{type:Boolean,default:false}
    },
    {
        timestamps: true,
        versionKey: false,
        _id: false
    }
);
LeaveAppliedDetailsSchema.plugin(mongooseUniqueValidator);

  //Perform actions before saving the bank details
  LeaveAppliedDetailsSchema.pre('save', function (next) {
    var _this=this;
    if (_this.isNew) {
        mongoose.model('leaveapplieddetails', LeaveAppliedDetailsSchema).count(function(err, c) {
              _this._id = c + 1;
              next();
        });
    }
  });

module.exports = mongoose.model('leaveapplieddetails',LeaveAppliedDetailsSchema);