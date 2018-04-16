let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let KraSchema = new Schema(
      {
         _id:{type:Number},
         KraWorkFlow_id:{type: Number,ref: 'kraWorkFlow'},
         supervisor_id:{type: Number,default:null},
         isApproved: {type: Boolean,default:false},
         declineReason: {type: String,default:null},
         approvedReason:{type: String, default:null},
         kraWeightage:{type: String, default:null},
         unitOfSuccess:{type: String, default:null},
         measureOfSuccess:{type: String, default:null},
         kraCategory_id:{type: String, default:null,ref: 'kraCategory'},
         kraStatus:{type: Number, default:null},
         isActive:{type: Boolean, default:true},

         updatedBy: {type: Number, default:null},
         createdBy: {type: Number, default:null},
         isDeleted: {type: Boolean,default:false} 
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

KraSchema.plugin(mongooseUniqueValidator);

  //Perform actions before saving the bank details
  KraSchema.pre('save', function (next) {
    var _this=this;
    if (_this.isNew) {
        mongoose.model('kra', KraSchema).count(function(err, c) {
              _this._id = c + 1;
              next();
        });
    }
  });

module.exports = mongoose.model('kra',KraSchema);
