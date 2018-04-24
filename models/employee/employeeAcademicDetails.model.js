let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let EmployeeAcademicDetailsSchema = new Schema(
      {
        _id:{type:Number},
        emp_id:{type:Number,ref:'employees'},
        levelOfEducation:{type:String,default:null},
        examDegreeTitle:{type:String,default:null},
        concentration:{type:String,default:null},
        instituteName:{type:String,default:null},
        result:{type:String,default:null},
        marks:{type:Number,default:null},
        cgpa:{type:String,default:null},
        scale:{type:String,default:null},
        yearOfPassing:{type:String,default:null},
        duration:{type:Number,default:null},
        achievements:{type:String,default:null},
        isCompleted:{type:Boolean,default:false},
        updatedBy:{type:Number,default:null},
        createdBy:{type:Number,default:null},
        isDeleted:{type:Boolean,default:false}
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

EmployeeAcademicDetailsSchema.plugin(mongooseUniqueValidator);

  //Perform actions before saving the bank details
  EmployeeAcademicDetailsSchema.pre('save', function (next) {
    var _this=this;
    if (_this.isNew) {
        mongoose.model('employeeAcademicDetails', EmployeeAcademicDetailsSchema).count(function(err, c) {
              _this._id = c + 1;
              next();
        });
    }
  });

module.exports = mongoose.model('employeeAcademicDetails',EmployeeAcademicDetailsSchema);
