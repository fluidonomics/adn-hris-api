let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let KraWorkFlowDetailsSchema = new Schema(
      {
        _id:{type:Number},
        batch_id:{type: Number,ref: 'batchdetails'},
        timeline_id:{type: Number,ref: 'timelinedetails',default:null},
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

   // Update the Emp_id Hash user password when registering or when changing password
   KraWorkFlowDetailsSchema.pre('save', function (next) {
    var _this=this;
    if (_this.isNew) {
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
    mongoose.model('kraWorkFlowDetails', KraWorkFlowDetailsSchema).find().sort({_id:-1}).limit(1)
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


KraWorkFlowDetailsSchema.plugin(mongooseUniqueValidator);

module.exports = mongoose.model('kraWorkFlowDetails',KraWorkFlowDetailsSchema);
