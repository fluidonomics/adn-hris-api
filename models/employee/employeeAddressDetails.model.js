let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let EmployeeAddressDetailsSchema = new Schema(
      {
         _id:{type:Number},
         emp_id:{type: Number,ref: 'employeedetails'},
         permanentAddressLine1 : {type: String, default:null},
         permanentAddressLine2 : {type: String, default:null},
         permanentAddressThana_id : {type: Number, default:null},
         permanentAddressDistrict_id : {type: Number, default:null},
         permanentAddressDivision_id : {type: Number, default:null},
         permanentAddressPostCode : {type: Number, default:null},
         currentAddressLine1 : {type: String, default:null},
         currentAddressLine2 : {type: String, default:null},
         currentAddressThana_id : {type: Number, default:null},
         currentAddressDistrict_id : {type: Number, default:null},
         currentAddressDivision_id : {type: Number, default:null},
         currentAddressPostCode : {type: Number, default:null},
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
