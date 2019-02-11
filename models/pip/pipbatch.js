let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let pipBatchSchema = new Schema(
      {
        _id:{type:Number},
        batchName:{type:String, default:null},
        batchEndDate: {type:Date, default:new Date() + 860000},
        createdBy: {type: Number,default:null},
        updatedBy: {type: Number,default:null},
        status:{type:String,default:'Active'},
        isDeleted: {type: Boolean,default:false},
        fiscalYearId: { type: Number, default: null }
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

   // Update the Emp_id Hash user password when registering or when changing password
   pipBatchSchema.pre('save', function (next) {
    var _this=this;
    if (_this.isNew) {
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
    mongoose.model('pipbatch', pipBatchSchema).find().sort({_id:-1}).limit(1)
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

pipBatchSchema.plugin(mongooseUniqueValidator);

module.exports = mongoose.model('pipbatch',pipBatchSchema);
