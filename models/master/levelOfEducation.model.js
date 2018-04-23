let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let LevelOfEducationSchema = new Schema(
      {
         _id:{type:Number},
         parent_id: {type:Number, default:null},
         levelOfEducationName: {type: String,required:true},
         updatedBy: {type: Number, default:null},
         createdBy: {type: Number, required: true},
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

      LevelOfEducationSchema.plugin(mongooseUniqueValidator);

      // LevelOfEducationSchema.pre('findOneAndUpdate', function (next) {
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
      LevelOfEducationSchema.pre('save', function (next) {
        var _this=this;
        if (_this.isNew) {
        mongoose.model('levelOfEducation', LevelOfEducationSchema).count(function(err, c) {
          _this._id = c + 1;
          next();
        });
      }
      });

      // LevelOfEducationSchema.post('findOneAndUpdate', function(result) {
      //   this.model.update({}, { 
      //       totalNumberOfComments: result.comments.length
      //   }).exec();
      // });

     module.exports = mongoose.model('levelOfEducation',LevelOfEducationSchema);

