let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let EmployeeFamilyDetailsSchema = new Schema(
      {
        _id:{type:Number},
        emp_id   :{type: Number,ref: 'employeedetails', required: true},    
        name     : {type: String,required:true},
        relation_id : {type: Number,default:null}, 
        dateOfBirth : {type: Date,default:null},
        contact  : {type: String,default:null},
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
   EmployeeFamilyDetailsSchema.pre('save', function (next) {
    var _this=this;
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
    mongoose.model('employeeFamilyDetails', EmployeeFamilyDetailsSchema).count(function(err, c) {
      _this._id = c + 1;
      next();
    });
});

EmployeeFamilyDetailsSchema.plugin(mongooseUniqueValidator);

     module.exports = mongoose.model('employeeFamilyDetails',EmployeeFamilyDetailsSchema);
