let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let KraCategoryDetailsSchema = new Schema(
      {
        _id:{type:Number},
        kraCategoryName:{type: String},
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
   KraCategoryDetailsSchema.pre('save', function (next) {
    var _this=this;
    if (_this.isNew) {
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
    mongoose.model('kraCategoryDetails', KraCategoryDetailsSchema).find().sort({_id:-1}).limit(1)
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

KraCategoryDetailsSchema.plugin(mongooseUniqueValidator);

module.exports = mongoose.model('kraCategoryDetails',KraCategoryDetailsSchema);
