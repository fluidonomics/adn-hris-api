let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let ProfileProcessDetailsSchema = new Schema(
      {
        _id:{type:Number},
        emp_id:{type: Number,ref:'employeedetails',required: true},
        employeeStatus:{type:String,default:null},//Submitted
        hrStatus:{type:String,default:null},//Submitted/SentBack
        supervisorStatus:{type:String,default:null},//Submitted/Approved
        hrSupervisorSendbackComment:{type: String,default:null},
        hrSendbackComment:{type:String,default:null},
        createdBy: {type: Number,default:null},
        updatedBy: {type: Number,default:null},
        isActive: {type: Boolean,default:true}, 
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

   // Update the Emp_id Hash user password when registering or when changing password
   ProfileProcessDetailsSchema.pre('save', function (next) {
    var _this=this;
    if (_this.isNew) {
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
    mongoose.model('employeeprofileProcessDetails', ProfileProcessDetailsSchema).count(function(err, c) {
      _this._id = c + 1;
      next();
    });
  }
});

ProfileProcessDetailsSchema.plugin(mongooseUniqueValidator);

module.exports = mongoose.model('employeeprofileProcessDetails',ProfileProcessDetailsSchema);
