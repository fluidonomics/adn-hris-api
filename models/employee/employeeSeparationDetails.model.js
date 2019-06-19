let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let EmployeeSeparationDetailsSchema = new Schema(
      {
        _id:{type:Number},
        emp_id   :{type: Number, ref: 'employeedetails', required: true},
        isActive : {type: Boolean, default:true},
        separationType :{type: String, default:null},
        dateOfResignation :{type: Date, default:null},
        dateOfSeparation :{type: Date, default:null},
        effectiveDate :{type: Date, default:null},
        createdBy: {type: Number, default:null},
        updatedBy: {type: Number, default:null},
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

   // Update the Emp_id Hash user password when registering or when changing password
   EmployeeSeparationDetailsSchema.pre('save', function (next) {
    var _this=this;
    if (_this.isNew) {
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
    mongoose.model('employeeSeparationDetails', EmployeeSeparationDetailsSchema).find().sort({_id:-1}).limit(1)
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

EmployeeSeparationDetailsSchema.plugin(mongooseUniqueValidator);

module.exports = mongoose.model('employeeSeparationDetails',EmployeeSeparationDetailsSchema );
