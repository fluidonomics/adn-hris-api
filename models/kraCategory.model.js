let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let KraCategorySchema = new Schema(
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

KraCategorySchema.plugin(mongooseUniqueValidator);

  //Perform actions before saving the bank details
  KraCategorySchema.pre('save', function (next) {
    var _this=this;
    if (_this.isNew) {
        mongoose.model('kraCategory', KraCategorySchema).count(function(err, c) {
              _this._id = c + 1;
              next();
        });
    }
  });

module.exports = mongoose.model('kraCategory',KraCategorySchema);
