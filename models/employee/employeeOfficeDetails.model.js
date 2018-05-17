let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let EmployeeOfficeDetailsSchema = new Schema(
      {
         _id:{type:Number},
         emp_id:{type: Number,ref: 'employeedetails', required: true, unique: true,},
         idCardNumber :{type: Number,default:null},
         officeEmail: {type: String, default:null, lowercase: true,uniqueCaseInsensitive:true},
         officePhone : {type: Number,default:null},
         officeMobile :  {type: Number,default:null},
         facility :{type: String,default:null},
         city:{type : String,default:null},
         country :{type: String,default:null},
         costCentre :{type: String,default:null},
         dateOfJoining :{type: Date,default:null},
         dateOfConfirmation :{type: Date,default:null},
         employmentStatus_id : {type: Number,default:null},
         managementType_id : {type: Number,default:null},
         jobTitle :{type: String,default:null},
         groupHrHead_id : {type: Number,default:null},
         businessHrHead_id : {type: Number,default:null},
         division_id : {type: Number,default:null},
         department_id : {type: Number,default:null},
         vertical_id : {type: Number,default:null},
         subVertical_id : {type: Number,default:null},
         tenureOfContract : {type: Number,default:null},
         workPermitNumber :{type: String,default:null},
         workPermitEffectiveDate :{type: Date,default:null},
         workPermitExpiryDate :{type: Date,default:null},
         employeeCategory :{type: String,default:null},
         reviewer_id : {type: Number,default:null},
         hrspoc_id : {type: Number,default:null},
         createdBy :{type: Number,default:null},
         updatedBy :{type: Number,default:null},
         isDeleted: {type: Boolean,default:false},
         isCompleted:{type:Boolean,default:false},
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });
      //UserRolesSchema.plugin(autoIncrement, {inc_field: '_id'});

   // Update the Emp_id Hash user password when registering or when changing password
   EmployeeOfficeDetailsSchema.pre('save', function (next) {
    var _this=this;
    if (_this.isNew) {
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
    mongoose.model('employeeOfficeDetails', EmployeeOfficeDetailsSchema).find().sort({_id:-1}).limit(1)
    .exec(function(err, doc)
    {
      if(doc.length >0)
      {
        _this._id=doc[0]._id + 1;
        next();
      }
      else{
        _this._id = 1;
        next();
      }
    });
  }
});

EmployeeOfficeDetailsSchema.plugin(mongooseUniqueValidator);

     module.exports = mongoose.model('employeeOfficeDetails',EmployeeOfficeDetailsSchema);
