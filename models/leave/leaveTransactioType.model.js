let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

    let LeaveTransactionTypeSchema = new Schema({
        _id: {type:Number},
        transaction_type: {type:String},
        // updatedBy:{type:Number,default:null},
        createdBy:{type:Number,default:null},
        isDeleted:{type:Boolean,default:null}
    },
    {
        timestamps: true,
        versionKey: false,
        _id: false
    }
);
LeaveTransactionTypeSchema.plugin(mongooseUniqueValidator);

  //Perform actions before saving the bank details
//   LeaveTransactionTypeSchema.pre('save', function (next) {
//     var _this=this;
//     if (_this.isNew) {
//         mongoose.model('leavetransactiontype', LeaveTransactionTypeSchema).count(function(err, c) {
//               _this._id = c + 1;
//               next();
//         });
//     }
//   });

   // Update the Emp_id Hash user password when registering or when changing password
   LeaveTransactionTypeSchema.pre('save', function (next) {
    var _this=this;
    if (_this.isNew) {
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
    mongoose.model('leavetransactiontype', LeaveTransactionTypeSchema).find().sort({_id:-1}).limit(1)
    .exec(function(err, doc)
    {
      if(doc.length >0)
      {
        _this._id=doc[0]._id + 1;
        next();
      }
      else{
        _this._id = 1;
        next();
      }
    });
  }
  });

module.exports = mongoose.model('leavetransactiontype',LeaveTransactionTypeSchema, 'leaveTransactionType');