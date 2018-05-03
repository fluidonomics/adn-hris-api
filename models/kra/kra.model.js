let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let EmployeeKraSchema = new Schema(
      {
          _id:{type:Number},
          kraWorkflow_id:{type:Number,ref:'kraworkflowdetails', required: true},
          kra:{type:String,default:null},
          category_id:{type:Number,default:null},
          weightage_id:{type:Number,default:null},
          unitOfSuccess:{type:String,default:null},
          measureOfSuccess:{type:String,default:null},
          supervisor_id:{type: Number,ref: 'employeedetails', required: true},  
          isDeleted:{type:Boolean,default:false},
          createdBy:{type:Number,default:null},
          updatedBy:{type:Number,default:null},
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });
      //UserRolesSchema.plugin(autoIncrement, {inc_field: '_id'});

   // Update the Emp_id Hash user password when registering or when changing password
   EmployeeKraSchema.pre('save', function (next) {
    var _this=this;
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
    mongoose.model('employeeKra', EmployeeKraSchema).count(function(err, c) {
      _this._id = c + 1;
      next();
    });
});
EmployeeKraSchema.plugin(mongooseUniqueValidator);
module.exports = mongoose.model('employeeKra',EmployeeKraSchema);
