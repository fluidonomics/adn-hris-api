let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let CompanyBusinessSchema = new Schema(
      {
        _id:{type:Number},
         companyBusinessName: {type: String,required:true,unique: true},
         updatedBy: {type: Number, default:null},
         createdBy: {type: Number, required: true},
         isDeleted:{type:Boolean,default:false}
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

      CompanyBusinessSchema.plugin(mongooseUniqueValidator);

      // CompanyBusinessSchema.pre('findOneAndUpdate', function (next) {
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
      CompanyBusinessSchema.pre('save', function (next) {
        var _this=this;
        if (_this.isNew) {
            mongoose.model('companyBusiness', CompanyBusinessSchema).count(function(err, c) {
                  _this._id = c + 1;
                  next();
            });
        }
      });

      // CompanyBusinessSchema.post('findOneAndUpdate', function(result) {
      //   this.model.update({}, { 
      //       totalNumberOfComments: result.comments.length
      //   }).exec();
      // });

     module.exports = mongoose.model('companyBusiness',CompanyBusinessSchema);

