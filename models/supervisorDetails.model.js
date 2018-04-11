let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let SupervisorDetailsSchema = new Schema(
      {
        _id:{type:Number},
        emp_id: {type: String,required:true,unique: true},
        primarySupervisorEmp_id: {type: String,required:true},
        secondarySupervisorEmp_id: {type: String, default:null},
        reason: {type: String, default:null},
        leaveSupervisorEmp_id: {type: String, default:null},
        isActive:{type:Boolean,default:true},
        updatedBy: {type: Number, default:null},
        createdBy: {type: Number, required: true}
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

      SupervisorDetailsSchema.plugin(mongooseUniqueValidator);

      // SupervisorDetailsSchema.pre('findOneAndUpdate', function (next) {
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
      SupervisorDetailsSchema.pre('save', function (next) {
        var _this=this;
        if (_this.isNew) {
            mongoose.model('SupervisorDetails', SupervisorDetailsSchema).count(function(err, c) {
                  _this._id = c + 1;
                  next();
            });
        }
      });

      // SupervisorDetailsSchema.post('findOneAndUpdate', function(result) {
      //   this.model.update({}, { 
      //       totalNumberOfComments: result.comments.length
      //   }).exec();
      // });

     module.exports = mongoose.model('SupervisorDetails',SupervisorDetailsSchema);

