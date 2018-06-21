let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let FinancialYearDetailsSchema = new Schema(
      {
        _id:{type:Number},
         financialYearName: {type: String,required:true,unique: false},
         starDate: {type: Date,required:true,unique: false},
         endDate: {type: Date,required:true,unique: false},
         isYearActive: {type: Boolean,required:true,unique: false},
         isDeleted:{type:Boolean,default:false}
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

      FinancialYearDetailsSchema.plugin(mongooseUniqueValidator);

      //Perform actions before saving the role
      FinancialYearDetailsSchema.pre('save', function (next) {
        var _this=this;
        if (_this.isNew) {
            mongoose.model('financialYearDetail', FinancialYearDetailsSchema).count(function(err, c) {
                  _this._id = c + 1;
                  next();
            });
        }
      });

     module.exports = mongoose.model('financialYearDetail',FinancialYearDetailsSchema);

