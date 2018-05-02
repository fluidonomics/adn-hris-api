let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let EmployeeCarDetailsSchema = new Schema(
      {
        _id:{type:Number},
        emp_id:{type: Number,ref: 'employeedetails', required: true, unique: true,},    
        companyRegistrationNumber:{type: String,default:null},
        companyEffectiveDate:{type: Date,default:null},
        companyExpiryDate:{type: Date,default:null},
        companyFuelAllowance:{type: String,default:null},
        companyMaintenanceAllowance:{type: String,default:null},
        companyDriverAllowance:{type: String,default:null},
        companyGrossPay:{type: String,default:null},
        privateRegistrationNumber:{type: String,default:null},
        privateEffectiveDate:{type: Date,default:null},
        privateExpiryDate:{type: Date,default:null},
        privateCarUsageAllowance:{type: String,default:null},
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
   EmployeeCarDetailsSchema.pre('save', function (next) {
    var _this=this;
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
    mongoose.model('employeeCarDetails', EmployeeCarDetailsSchema).count(function(err, c) {
      _this._id = c + 1;
      next();
    });
});

EmployeeCarDetailsSchema.plugin(mongooseUniqueValidator);

     module.exports = mongoose.model('employeeCarDetails',EmployeeCarDetailsSchema);
