let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let EmployeeSeparationDetailsSchema = new Schema(
      {
         _id:{type:Number},
         emp_id:{type: Number,ref: 'employeedetails'},
         dateOfResignation:{type: Date,default:null},
         dateOfSeparation: {type: Date,default:null},
         effectiveDate: {type: Date,default:null},
         separationType:{type: String, default:null},

         updatedBy: {type: Number, default:null},
         createdBy: {type: Number, default:null},
         isDeleted: {type: Boolean,default:false} 
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

EmployeeSeparationDetailsSchema.plugin(mongooseUniqueValidator);

  //Perform actions before saving the bank details
  EmployeeSeparationDetailsSchema.pre('save', function (next) {
    var _this=this;
    if (_this.isNew) {
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

module.exports = mongoose.model('employeeSeparationDetails',EmployeeSeparationDetailsSchema);
