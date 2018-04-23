let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let EmployeeContractDetailsSchema = new Schema(
      {
         _id:{type:Number},
         emp_id:{type: Number,ref: 'employees', required: true, unique: true,},
         contractPeriod :{type: Number,default:null},
         isContractExtended : {type: Boolean,default:false},
         IsContractCompleted : {type: Boolean,default:false},
         isActive :  {type: Boolean,default:true},
         createdBy :{type: Number,default:null},
         updatedBy :{type: Number,default:null},
         isDeleted: {type: Boolean,default:false},
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

   // Update the Emp_id Hash user password when registering or when changing password
   EmployeeContractDetailsSchema.pre('save', function (next) {
    var _this=this;
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
    mongoose.model('employeeContractDetails', EmployeeContractDetailsSchema).count(function(err, c) {
      _this._id = c + 1;
      next();
    });
});

EmployeeContractDetailsSchema.plugin(mongooseUniqueValidator);

     module.exports = mongoose.model('employeeContractDetails',EmployeeContractDetailsSchema);
