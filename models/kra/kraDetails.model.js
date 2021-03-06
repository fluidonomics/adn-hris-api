let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let KraDetailsSchema = new Schema(
      {
        _id:{type:Number},
          kraWorkflow_id:{type:Number,ref:'kraworkflowdetails', required: true},
          kra:{type:String,default:null},
          category_id:{type:Number,default:null},
          weightage_id:{type:Number,default:null},
          unitOfSuccess:{type:String,default:null},
          measureOfSuccess:{type:String,default:null},
          supervisor_id:{type: Number,ref:'employeedetails'},
          unitOfSuccess:{type:String,default:null},
          supervisorStatus:{type:String,default:null},
          sendBackComment:{type: String,default:null},
          isDeleted:{type:Boolean,default:false},
          createdBy:{type:Number,default:null},
          updatedBy:{type:Number,default:null},
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

   // Update the Emp_id Hash user password when registering or when changing password
   KraDetailsSchema.pre('save', function (next) {
    var _this=this;
    if (_this.isNew) {
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
    mongoose.model('kraDetails', KraDetailsSchema).find().sort({_id:-1}).limit(1)
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

KraDetailsSchema.plugin(mongooseUniqueValidator);

module.exports = mongoose.model('kraDetails',KraDetailsSchema);
