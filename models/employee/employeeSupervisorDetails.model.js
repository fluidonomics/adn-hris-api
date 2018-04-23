let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let EmployeeSupervisorDetailsSchema = new Schema(
      {
        _id:{type:Number},
        emp_id: {type: String,required:true,unique: true},
        primarySupervisorEmp_id: {type: String},
        secondarySupervisorEmp_id: {type: String, default:null},
        reason: {type: String, default:null},
        leaveSupervisorEmp_id: {type: String, default:null},
        isActive:{type:Boolean,default:true},
        updatedBy: {type: Number, default:null},
        createdBy: {type: Number, required:true}
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

      EmployeeSupervisorDetailsSchema.plugin(mongooseUniqueValidator);

      // EmployeeSupervisorDetailsSchema.pre('findOneAndUpdate', function (next) {
      //   this.setOptions({
      //     new: true,
      //     runValidators: true
      //   });
      //   this.update({}, {
      //     createdAt: Date.now()
      //   });
      //   next();
      // });

      //Perform actions before saving the role
      EmployeeSupervisorDetailsSchema.pre('save', function (next) {
        var _this=this;
        if (_this.isNew) {
            mongoose.model('employeeSupervisorDetails', EmployeeSupervisorDetailsSchema).count(function(err, c) {
                  _this._id = c + 1;
                  next();
            });
        }
      });

      // EmployeeSupervisorDetailsSchema.post('findOneAndUpdate', function(result) {
      //   this.model.update({}, { 
      //       totalNumberOfComments: result.comments.length
      //   }).exec();
      // });

     module.exports = mongoose.model('employeeSupervisorDetails',EmployeeSupervisorDetailsSchema);

