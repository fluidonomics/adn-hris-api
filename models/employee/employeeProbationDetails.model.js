let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let EmployeeProbationDetailsSchema = new Schema(
      {
         _id:{type:Number},
         emp_id:{type: Number,ref: 'employees', required: true, unique: true,},
         probationPeriod :{type: Number,default:null},
         isProbationExtended : {type: Boolean,default:false},
         IsProbationCompleted : {type: Boolean,default:false},
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
   EmployeeProbationDetailsSchema.pre('save', function (next) {
    var _this=this;
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
    mongoose.model('employeeProbationDetails', EmployeeProbationDetailsSchema).count(function(err, c) {
      _this._id = c + 1;
      next();
    });
});

EmployeeProbationDetailsSchema.plugin(mongooseUniqueValidator);

     module.exports = mongoose.model('employeeProbationDetails',EmployeeProbationDetailsSchema);
