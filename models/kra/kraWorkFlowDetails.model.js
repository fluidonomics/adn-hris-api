let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let KraWorkflowDetailsSchema = new Schema(
      {
         _id:{type:Number},
         batch_id:{type: Number,ref: 'batchdetails'},
         timeline_id:{type: Number,ref: 'timelinedetails'},
         emp_id:{type: Number,ref: 'employeedetails'},
         status: {type: String,default:null},
         updatedBy: {type: Number, default:null},
         createdBy: {type: Number, default:null},
         isDeleted: {type: Boolean,default:false} 
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

KraWorkflowDetailsSchema.plugin(mongooseUniqueValidator);

  //Perform actions before saving the bank details
  KraWorkflowDetailsSchema.pre('save', function (next) {
    var _this=this;
    if (_this.isNew) {
        mongoose.model('kraWorkflowDetails', KraWorkflowDetailsSchema).count(function(err, c) {
              _this._id = c + 1;
              next();
        });
    }
  });
module.exports = mongoose.model('kraWorkflowDetails',KraWorkflowDetailsSchema);
