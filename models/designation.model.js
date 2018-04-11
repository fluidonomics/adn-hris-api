let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let DesignationSchema = new Schema(
      {
        _id:{type:Number},
         designationName: {type: String,required:true},
         grade_id: {type:Number,ref:'grades'},
         updatedBy: {type: Number, default:null},
         createdBy: {type: Number, required: true},
         isActive:{type:Boolean,default:true}
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

      DesignationSchema.plugin(mongooseUniqueValidator);

      // DesignationSchema.pre('findOneAndUpdate', function (next) {
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
      DesignationSchema.pre('save', function (next) {
        var _this=this;
        if (_this.isNew) {
        mongoose.model('designation', DesignationSchema).count(function(err, c) {
          _this._id = c + 1;
          next();
        });
      }
      });

      // DesignationSchema.post('findOneAndUpdate', function(result) {
      //   this.model.update({}, { 
      //       totalNumberOfComments: result.comments.length
      //   }).exec();
      // });

     module.exports = mongoose.model('designation',DesignationSchema);

