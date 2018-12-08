let mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  mongooseUniqueValidator = require('mongoose-unique-validator'),
  bcrypt = require('bcrypt');
autoIncrement = require('mongoose-sequence')(mongoose);

let MidTermDetailsSchema = new Schema(
  {
    _id: { type: Number },
    kraWorkflow_id: { type: Number, ref: 'kraworkflowdetails', required: true },
    kraDetailId: { type: Number, ref: 'kradetails', required: true },
    emp_comment: { type: String },
    supervisor_comment: { type: String },
    supervisor_id: { type: Number },
    mtr_batch_id: { type: Number, required: true },
    status: { type: String },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Number, default: null },
    updatedBy: { type: Number, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    _id: false
  });

// Update the Emp_id Hash user password when registering or when changing password
MidTermDetailsSchema.pre('save', function (next) {
  var _this = this;
  if (_this.isNew) {
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
    mongoose.model('midtermDetails', MidTermDetailsSchema).find().sort({ _id: -1 }).limit(1)
      .exec(function (err, doc) {
        if (doc.length > 0) {
          _this._id = doc[0]._id + 1;
          next();
        }
        else {
          _this._id = 1;
          next();
        }
      });
  }
});

MidTermDetailsSchema.plugin(mongooseUniqueValidator);

module.exports = mongoose.model('midtermDetails', MidTermDetailsSchema);
