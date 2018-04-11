let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let AuditTrailSchema = new Schema(
      {
         _id:{type:Number},
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
        _id:false
      });
      //UserRolesSchema.plugin(autoIncrement, {inc_field: '_id'});

   // Update the Emp_Id Hash user password when registering or when changing password
    AuditTrailSchema.pre('save', function (next) {
    var _this=this;
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_Id 
    mongoose.model('auditTrail', AuditTrailSchema).count(function(err, c) {
      _this._id = c + 1;
      next();
    });
});

AuditTrailSchema.plugin(mongooseUniqueValidator);

     module.exports = mongoose.model('auditTrail',AuditTrailSchema);
