let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let EmployeePersonalDetailsSchema = new Schema(
      {
         _id:{type:Number},
         emp_id:{type: Number,ref: 'employeedetails'},
         gender:{type: String},
         personalMobileNumber: {type: Number,default:null},
         personalEmail:{type: String, unique: true,lowercase: true,uniqueCaseInsensitive:true},
         dob : {type: Date, default:null},
         bloodGroup : {type: String, default:null},
         religion : {type: String, default:null},
         nationality : {type: String, default:null},
         homePhone : {type: Number, default:null},
         motherName : {type: String, default:null},
         fatherName : {type: String, default:null},
         maritialStatus : {type: String, default:null},
         emergencyContactPerson : {type: String, default:null},
         emergencyContactNumber : {type: Number, default:null},        
         isCompleted : {type: Boolean, default:false},
         isDeleted: {type: Boolean,default:false},
         updatedBy: {type: Number, default:null},
         createdBy: {type: Number, required: true}
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });
      //UserRolesSchema.plugin(autoIncrement, {inc_field: '_id'});

   // Update the Emp_Id Hash user password when registering or when changing password
    EmployeePersonalDetailsSchema.pre('save', function (next) {
    var _this=this;
    if (_this.isNew) {
       //Check the Count of Collection and add 1 to the Count and Assign it to Emp_Id 
      mongoose.model('employeePersonalDetails', EmployeePersonalDetailsSchema).count(function(err, c) {
        _this._id = c + 1;
        next();
      });
    }
});

EmployeePersonalDetailsSchema.plugin(mongooseUniqueValidator);

     module.exports = mongoose.model('employeePersonalDetails',EmployeePersonalDetailsSchema);
