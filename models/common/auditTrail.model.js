let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let AuditTrailSchema = new Schema(
      {
         //_id:{type:Number},
         emp_id:{type: Number,ref: 'employees'},
         collectionName:{type: String,default:null},
         document_id: {type: String,default:null},
         document_values: {type: String,default:null},
         controllerName:{type: String, default:null},
         action:{type: String, default:null},
         comments : {type: String, default:null},
      },
      {
        timestamps: true,
        versionKey: false,
        //_id:false
      });

AuditTrailSchema.plugin(mongooseUniqueValidator);

  //Perform actions before saving the role
  // AuditTrailSchema.pre('save', function (next) {
  //   var _this=this;
  //   if (_this.isNew) {
  //       mongoose.model('auditTrail', AuditTrailSchema).count(function(err, c) {
  //             _this._id = c + 1;
  //             next();
  //       });
  //   }
  // });

module.exports = mongoose.model('auditTrail',AuditTrailSchema);
