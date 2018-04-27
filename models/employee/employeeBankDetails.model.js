let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let EmployeeBankDetailsSchema = new Schema(
      {
         _id:{type:Number},
         emp_id:{type: Number,ref: 'employeedetails'},
         bankName:{type: String,default:null},
         accountName: {type: String,default:null},
         accountNumber: {type: String,default:null},
         currency:{type: String, default:null},
         modeOfPaymentType:{type: String, default:null},
         updatedBy: {type: Number, default:null},
         createdBy: {type: Number, default:null},
         isDeleted: {type: Boolean,default:false} 
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

EmployeeBankDetailsSchema.plugin(mongooseUniqueValidator);

  //Perform actions before saving the bank details
  EmployeeBankDetailsSchema.pre('save', function (next) {
    var _this=this;
    if (_this.isNew) {
        mongoose.model('employeeBankDetails', EmployeeBankDetailsSchema).count(function(err, c) {
              _this._id = c + 1;
              next();
        });
    }
  });

module.exports = mongoose.model('employeeBankDetails',EmployeeBankDetailsSchema);
