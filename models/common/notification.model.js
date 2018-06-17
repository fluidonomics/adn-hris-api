let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema;
 


      let NotificationSchema = new Schema(
      {
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
         createdBy: {type: Number, default:null}
      },
      {
        timestamps: true,
        versionKey: false,
      });

     module.exports = mongoose.model('notification',NotificationSchema);
