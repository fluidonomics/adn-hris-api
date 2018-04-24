let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let EmployeePreviousEmploymentDetailsSchema = new Schema(
      {
        _id:{type:Number},
        emp_id   :{type: Number,ref: 'employees', required: true},    
        companyName : {type: String,default:null}, 
        companyBusiness : {type: String,default:null}, 
        designation : {type: String,default:null}, 
        department : {type: String,default:null}, 
        responsibility : {type: String,default:null}, 
        companyLocation : {type: String,default:null}, 
        employmentPeriodFrom : {type:Date,default:null},
        employmentPeriodTo : {type:Date,default:null}, 
        areaOfExperience : {type: String,default:null}, 
        isCompleted: {type: Boolean,default:false},
        createdBy: {type: Number,default:null},
        updatedBy: {type: Number,default:null},
        isDeleted: {type: Boolean,default:false},
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

   // Update the Emp_id Hash user password when registering or when changing password
   EmployeePreviousEmploymentDetailsSchema.pre('save', function (next) {
    var _this=this;
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
    mongoose.model('employeePreviousEmploymentDetails', EmployeePreviousEmploymentDetailsSchema).count(function(err, c) {
      _this._id = c + 1;
      next();
    });
});

EmployeePreviousEmploymentDetailsSchema.plugin(mongooseUniqueValidator);

     module.exports = mongoose.model('employeePreviousEmploymentDetails',EmployeePreviousEmploymentDetailsSchema);
