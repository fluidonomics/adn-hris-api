let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let ExamDegreeTitleSchema = new Schema(
      {
        _id:{type:Number},
         examDegreeTitleName: {type: String,required:true},
         levelOfEducation_id: {type:Number,ref:'levelsOfEducation'},
         updatedBy: {type: Number, default:null},
         createdBy: {type: Number, required: true},
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

      ExamDegreeTitleSchema.plugin(mongooseUniqueValidator);

      // ExamDegreeTitleSchema.pre('findOneAndUpdate', function (next) {
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
      ExamDegreeTitleSchema.pre('save', function (next) {
        var _this=this;
        if (_this.isNew) {
        mongoose.model('examDegreeTitle', ExamDegreeTitleSchema).count(function(err, c) {
          _this._id = c + 1;
          next();
        });
      }
      });

      // ExamDegreeTitleSchema.post('findOneAndUpdate', function(result) {
      //   this.model.update({}, { 
      //       totalNumberOfComments: result.comments.length
      //   }).exec();
      // });

     module.exports = mongoose.model('examDegreeTitle',ExamDegreeTitleSchema);

