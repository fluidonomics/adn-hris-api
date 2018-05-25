let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let DocumentSchema = new Schema(
      {
        _id:{type:Number},
         documentName: {type: String,required:true},
         documentUrl: {type: String, default:null},
         updatedBy: {type: Number, default:null},
         createdBy: {type: Number, required: true},
         isDeleted:{type:Boolean,default:false}
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

      DocumentSchema.plugin(mongooseUniqueValidator);

      // DocumentSchema.pre('findOneAndUpdate', function (next) {
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
      DocumentSchema.pre('save', function (next) {
        var _this=this;
        if (_this.isNew) {
            mongoose.model('document', DocumentSchema).count(function(err, c) {
                  _this._id = c + 1;
                  next();
            });
        }
      });

      // DocumentSchema.post('findOneAndUpdate', function(result) {
      //   this.model.update({}, { 
      //       totalNumberOfComments: result.comments.length
      //   }).exec();
      // });

     module.exports = mongoose.model('document',DocumentSchema);

