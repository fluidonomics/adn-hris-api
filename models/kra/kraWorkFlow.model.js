let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let KraWorkFlowSchema = new Schema(
      {
         _id:{type:Number},
         kraEmp_id:{type: Number,ref: 'employees'},
         kraInitiatedBy:{type: Number,default:null},
         endDate: {type: Date,default:null},
         kraWorkFlowStatus: {type: String,default:null},
         updatedBy: {type: Number, default:null},
         createdBy: {type: Number, default:null},
         isDeleted: {type: Boolean,default:false} 
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

KraWorkFlowSchema.plugin(mongooseUniqueValidator);

  //Perform actions before saving the bank details
  KraWorkFlowSchema.pre('save', function (next) {
    var _this=this;
    if (_this.isNew) {
        mongoose.model('kraWorkFlow', KraWorkFlowSchema).count(function(err, c) {
              _this._id = c + 1;
              next();
        });
    }
  });

module.exports = mongoose.model('kraWorkFlow',KraWorkFlowSchema);
