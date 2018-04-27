let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let EmployeeAddressDetailsSchema = new Schema(
      {
         _id:{type:Number},
         emp_id:{type: Number,ref: 'employeedetails'},
         permanentEmployeeAddressDetailsLine1 : {type: String, default:null},
         permanentEmployeeAddressDetailsLine2 : {type: String, default:null},
         permanentEmployeeAddressDetailsThana_id : {type: Number, default:null},
         permanentEmployeeAddressDetailsDistrict_id : {type: Number, default:null},
         permanentEmployeeAddressDetailsDivision_id : {type: Number, default:null},
         permanentEmployeeAddressDetailsPostCode : {type: Number, default:null},
         
         currentEmployeeAddressDetailsLine1 : {type: String, default:null},
         currentEmployeeAddressDetailsLine2 : {type: String, default:null},
         currentEmployeeAddressDetailsThana_id : {type: Number, default:null},
         currentEmployeeAddressDetailsDistrict_id : {type: Number, default:null},
         currentEmployeeAddressDetailsDivision_id : {type: Number, default:null},
         currentEmployeeAddressDetailsPostCode : {type: Number, default:null},
         isSameAsCurrent : {type: Boolean, default:false},
         isActive: {type: Boolean,default:true},
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
    EmployeeAddressDetailsSchema.pre('save', function (next) {
    var _this=this;
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_Id 
    mongoose.model('employeeAddressDetails', EmployeeAddressDetailsSchema).count(function(err, c) {
      _this._id = c + 1;
      next();
    });
});

EmployeeAddressDetailsSchema.plugin(mongooseUniqueValidator);

     module.exports = mongoose.model('employeeAddressDetails',EmployeeAddressDetailsSchema);
