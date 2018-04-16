let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let CurrencySchema = new Schema(
      {
        _id:{type:Number},
         currencyName: {type: String,required:true,unique: true},
         updatedBy: {type: Number, default:null},
         createdBy: {type: Number, required: true},
         isDeleted:{type:Boolean,default:false}
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

      CurrencySchema.plugin(mongooseUniqueValidator);

      // CurrencySchema.pre('findOneAndUpdate', function (next) {
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
      CurrencySchema.pre('save', function (next) {
        var _this=this;
        if (_this.isNew) {
          mongoose.model('currency', CurrencySchema).count(function(err, c) {
            _this._id = c + 1;
            next();
          });
      }
      }); 

      // CurrencySchema.post('findOneAndUpdate', function(result) {
      //   this.model.update({}, { 
      //       totalNumberOfComments: result.comments.length
      //   }).exec();
      // });

     module.exports = mongoose.model('currency',CurrencySchema);

