let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let ProfileProcessDetailsSchema = new Schema(
      {
        _id:{type:Number},
        emp_id:{type: Number,ref:'employeedetails',required: true},
        hr_id:{type: Number,ref:'employeedetails',required: true},
        hrSupervisor_id:{type: Number,ref:'employeedetails',required: true},
        personalProfileStatus:{type: String,default:null},//Submitted/SentBack/Approved
        officeProfileStatus:{type: String,default:null},//Submitted/SentBack/Approved
        hrSupervisorSendbackComment:{type: String,default:null},
        hrSendbackComment:{type:String,required:true},
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
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
    mongoose.model('profileProcessDetails', ProfileProcessDetailsSchema).count(function(err, c) {
      _this._id = c + 1;
      next();
    });
});

ProfileProcessDetailsSchema.plugin(mongooseUniqueValidator);

module.exports = mongoose.model('profileProcessDetails',ProfileProcessDetailsSchema);
