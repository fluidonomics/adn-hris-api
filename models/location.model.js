let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let LocationSchema = new Schema(
      {
        _id:{type:Number},
         locationName: {type: String,required:true},
         parent_id: {type:Number, default:null},
         updatedBy: {type: Number, default:null},
         createdBy: {type: Number, required: true},
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

      LocationSchema.plugin(mongooseUniqueValidator);

      // LocationSchema.pre('findOneAndUpdate', function (next) {
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
      LocationSchema.pre('save', function (next) {
        var _this=this;
        if (_this.isNew) {
        mongoose.model('location', LocationSchema).count(function(err, c) {
          _this._id = c + 1;
          next();
        });
      }
      });

      // LocationSchema.post('findOneAndUpdate', function(result) {
      //   this.model.update({}, { 
      //       totalNumberOfComments: result.comments.length
      //   }).exec();
      // });

     module.exports = mongoose.model('location',LocationSchema);

