let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let NotificationSchema = new Schema(
      {
         _id:{type:Number},
         emp_id:{type: Number,ref: 'employees'},
         title:{type: String,default:null},
         message: {type: String,default:null},
         linkUrl: {type: String,default:null},
         senderEmp_id:{type: Number, default:null},
         recipientEmp_id : {type: Number, default:null},
         type_id : {type: String, default:null},
         isRead : {type: Boolean, default:false},
         isReadDateTime : {type: Date, default:null},
         isDeleted: {type: Boolean,default:false},
         updatedBy: {type: Number, default:null},
         createdBy: {type: Number, required: true}
      },
      {
        timestamps: true,
        _id:false
      });
      //UserRolesSchema.plugin(autoIncrement, {inc_field: '_id'});

   // Update the Emp_Id Hash user password when registering or when changing password
    NotificationSchema.pre('save', function (next) {
    var _this=this;
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_Id 
    mongoose.model('notification', NotificationSchema).count(function(err, c) {
      _this._id = c + 1;
      next();
    });
});

NotificationSchema.plugin(mongooseUniqueValidator);

     module.exports = mongoose.model('notification',NotificationSchema);
