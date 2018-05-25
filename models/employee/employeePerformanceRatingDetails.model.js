let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let EmployeePerformanceRatingDetailsSchema = new Schema(
      {
         _id:{type:Number},
         emp_id:{type: Number,ref: 'employeedetails'},
         performanceRating_id:{type: Number,ref:'performanceratings'},
         performanceRatingValue: {type:String,default:null},
         updatedBy: {type: Number, default:null},
         createdBy: {type: Number, default:null},
         isDeleted: {type: Boolean,default:false},
         isCompleted: {type: Boolean,default:false} 
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

EmployeePerformanceRatingDetailsSchema.plugin(mongooseUniqueValidator);

  //Perform actions before saving the performanceRating details
  EmployeePerformanceRatingDetailsSchema.pre('save', function (next) {
    var _this=this;
    if (_this.isNew) {
        mongoose.model('employeePerformanceRatingDetails', EmployeePerformanceRatingDetailsSchema).find().sort({_id:-1}).limit(1)
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

module.exports = mongoose.model('employeePerformanceRatingDetails',EmployeePerformanceRatingDetailsSchema);
