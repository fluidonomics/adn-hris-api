let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let EducationSchema = new Schema(
      {
         _id:{type:Number},
         parent_id: {type:Number, default:null},
         educationName: {type: String,required:true},
         updatedBy: {type: Number, default:null},
         createdBy: {type: Number, required: true},
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

      EducationSchema.plugin(mongooseUniqueValidator);

      // EducationSchema.pre('findOneAndUpdate', function (next) {
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
      EducationSchema.pre('save', function (next) {
        var _this=this;
        if (_this.isNew) {
        mongoose.model('education', EducationSchema).count(function(err, c) {
          _this._id = c + 1;
          next();
        });
      }
      });

      // EducationSchema.post('findOneAndUpdate', function(result) {
      //   this.model.update({}, { 
      //       totalNumberOfComments: result.comments.length
      //   }).exec();
      // });

     module.exports = mongoose.model('education',EducationSchema);

