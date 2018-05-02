let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let EmployeeCertificationDetailsSchema = new Schema(
      {
         _id:{type:Number},
         emp_id:{type: Number,ref: 'employeedetails'},
         certificationTitle:{type: String,default:null},
         location: {type: String,default:null},
         institution: {type: String,default:null},
         duration:{type: String, default:null},
         topicsCovered:{type: String, default:null},
         isCompleted:{type:Boolean,default:false},
         updatedBy: {type: Number, default:null},
         createdBy: {type: Number, default:null},
         isDeleted: {type: Boolean,default:false} 
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

EmployeeCertificationDetailsSchema.plugin(mongooseUniqueValidator);

  //Perform actions before saving the bank details
  EmployeeCertificationDetailsSchema.pre('save', function (next) {
    var _this=this;
    if (_this.isNew) {
        mongoose.model('employeeCertificationDetails', EmployeeCertificationDetailsSchema).count(function(err, c) {
              _this._id = c + 1;
              next();
        });
    }
  });

module.exports = mongoose.model('employeeCertificationDetails',EmployeeCertificationDetailsSchema);
