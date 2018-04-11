let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let EmploymentTypeSchema = new Schema(
      {
        _id:{type:Number},
         employmentTypeName: {type: String,required:true},
         managementType_id: {type: Number,required:true},
         updatedBy: {type: Number, default:null},
         createdBy: {type: Number, required: true},
         isDeleted:{type:Boolean,default:false}
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

      EmploymentTypeSchema.plugin(mongooseUniqueValidator);

      // EmploymentTypeSchema.pre('findOneAndUpdate', function (next) {
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
      EmploymentTypeSchema.pre('save', function (next) {
        var _this=this;
        if (_this.isNew) {
            mongoose.model('employmentType', EmploymentTypeSchema).count(function(err, c) {
                  _this._id = c + 1;
                  next();
            });
        }
      });

      // EmploymentTypeSchema.post('findOneAndUpdate', function(result) {
      //   this.model.update({}, { 
      //       totalNumberOfComments: result.comments.length
      //   }).exec();
      // });

     module.exports = mongoose.model('employmentType',EmploymentTypeSchema);

