let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let GradeDesignationSchema = new Schema(
      {
        _id:{type:Number},
         grade_id: {type: Number, required: true},
         designation_id: {type: Number, required: true},
         updatedBy: {type: Number, default:null},
         createdBy: {type: Number, required: true},
         isActive:{type:Boolean,default:true}
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

      GradeDesignationSchema.plugin(mongooseUniqueValidator);

      // GradeDesignationSchema.pre('findOneAndUpdate', function (next) {
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
      GradeDesignationSchema.pre('save', function (next) {
        var _this=this;
        if (_this.isNew) {
        mongoose.model('gradeDesignation', GradeDesignationSchema).count(function(err, c) {
          _this._id = c + 1;
          next();
        });
      }
      });

      // GradeDesignationSchema.post('findOneAndUpdate', function(result) {
      //   this.model.update({}, { 
      //       totalNumberOfComments: result.comments.length
      //   }).exec();
      // });

     module.exports = mongoose.model('gradeDesignation',GradeDesignationSchema);

