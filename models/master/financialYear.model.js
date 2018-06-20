let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let FinancialYearSchema = new Schema(
      {
        _id:{type:Number},
         financialYearName: {type: String,required:true,unique: false},
         starDate: {type: Date,required:true,unique: false},
         endDate: {type: Date,required:true,unique: false},
         isYearActive: {type: Boolean,required:true,unique: false},
         companyId: {type: Number, required: true, unique: false},
         updatedBy: {type: Number, default:null},
         createdBy: {type: Number, required: true},
         isDeleted:{type:Boolean,default:false}
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

      FinancialYearSchema.plugin(mongooseUniqueValidator);

      //Perform actions before saving the role
      FinancialYearSchema.pre('save', function (next) {
        var _this=this;
        if (_this.isNew) {
            mongoose.model('financialYear', FinancialYearSchema).count(function(err, c) {
                  _this._id = c + 1;
                  next();
            });
        }
      });

     module.exports = mongoose.model('financialYear',FinancialYearSchema);

