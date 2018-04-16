let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let EmpCertificateSchema = new Schema(
      {
         _id:{type:Number},
         emp_id:{type: Number,ref: 'employees'},
         certificationTitle:{type: String,default:null},
         location: {type: String,default:null},
         institution: {type: String,default:null},
         duration:{type: String, default:null},
         topicsCovered:{type: String, default:null},
         updatedBy: {type: Number, default:null},
         createdBy: {type: Number, default:null},
         isDeleted: {type: Boolean,default:false} 
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

EmpCertificateSchema.plugin(mongooseUniqueValidator);

  //Perform actions before saving the bank details
  EmpCertificateSchema.pre('save', function (next) {
    var _this=this;
    if (_this.isNew) {
        mongoose.model('empCertificate', EmpCertificateSchema).count(function(err, c) {
              _this._id = c + 1;
              next();
        });
    }
  });

module.exports = mongoose.model('empCertificate',EmpCertificateSchema);
