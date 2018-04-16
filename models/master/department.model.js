let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let DepartmentSchema = new Schema(
      {
        _id:{type:Number},
         departmentName: {type: String,required:true},
         division_id: {type:Number,ref:'divisions'},
         updatedBy: {type: Number, default:null},
         createdBy: {type: Number, required: true},
         isDeleted:{type:Boolean,default:false}
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

      DepartmentSchema.plugin(mongooseUniqueValidator);

      // DepartmentSchema.pre('findOneAndUpdate', function (next) {
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
      DepartmentSchema.pre('save', function (next) {
        var _this=this;
        if (_this.isNew) {
        mongoose.model('department', DepartmentSchema).count(function(err, c) {
          _this._id = c + 1;
          next();
        });
      }
      });

      // DepartmentSchema.post('findOneAndUpdate', function(result) {
      //   this.model.update({}, { 
      //       totalNumberOfComments: result.comments.length
      //   }).exec();
      // });

     module.exports = mongoose.model('department',DepartmentSchema);

