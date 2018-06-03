let mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt = require('bcrypt');
autoIncrement = require('mongoose-sequence')(mongoose);

let LeaveWorkflowHistorySchema = new Schema({
    _id: { type: Number },
    appliedLeaveId: { type: Number },
    emp_id: { type: Number, default: null },
    Owner: { type: Number, default: null },
    updatedAt: { type: Date, default: null },
    Step: { type: String, default: null }, //(Type of transaction or action done on leave eg - applied, canceled, Accepted, Review, Rejected, Forwarded)
    Status: { type: String, default: null },
    isDeleted: { type: Boolean, default: null },
},
    {
        timestamps: true,
        versionKey: false,
        _id: false
    }
);

 // Update the Emp_id Hash user password when registering or when changing password
 LeaveWorkflowHistorySchema.pre('save', function (next) {
    var _this=this;
    if (_this.isNew) {
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
    mongoose.model('leaveworkflowhistory', LeaveWorkflowHistorySchema).find().sort({_id:-1}).limit(1)
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



LeaveWorkflowHistorySchema.plugin(mongooseUniqueValidator);

 // Update the Emp_id Hash user password when registering or when changing password
 LeaveWorkflowHistorySchema.pre('save', function (next) {
  var _this=this;
  if (_this.isNew) {
  //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
  mongoose.model('leaveworkflowhistory', LeaveWorkflowHistorySchema).find().sort({_id:-1}).limit(1)
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


module.exports = mongoose.model('leaveworkflowhistory', LeaveWorkflowHistorySchema, 'leaveworkflowhistory');