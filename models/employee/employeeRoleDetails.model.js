let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let EmployeeRoleDetailsSchema = new Schema(
      {
          _id:{type:Number},
         emp_id:{type: Number,ref: 'employeedetails'},
         role_id:{type: Number, ref: 'roles'},
         isDeleted: {type: Boolean,default:false},
         createdBy: {type: Number,default:null},
         updatedBy: {type: Number,default:null},
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });
      //EmployeeRoleDetailsSchema.plugin(autoIncrement, {inc_field: '_id'});

// Update the Emp_Id Hash user password when registering or when changing password
EmployeeRoleDetailsSchema.pre('save', function (next) {
  var _this=this;
  if (_this.isNew) {
      //Check the Count of Collection and add 1 to the Count and Assign it to Emp_Id 
      mongoose.model('employeeRoleDetails', EmployeeRoleDetailsSchema).find().sort({_id:-1}).limit(1)
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

      EmployeeRoleDetailsSchema.plugin(mongooseUniqueValidator);

     module.exports = mongoose.model('employeeRoleDetails',EmployeeRoleDetailsSchema);
