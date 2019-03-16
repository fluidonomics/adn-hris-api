let mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  mongooseUniqueValidator = require('mongoose-unique-validator'),
  bcrypt = require('bcrypt');
autoIncrement = require('mongoose-sequence')(mongoose);

let pipMasterSchema = new Schema(
  {
    _id: { type: Number },
    batch_id: { type: Number, ref: 'pipbatches' },
    emp_id: { type: Number, ref: 'employeedetails' },
    status: { type: String, default: null },
    updatedBy: { type: Number, default: null },
    createdBy: { type: Number, default: null },
    isDeleted: { type: Boolean, default: false },
    sup_final_com: { type: String, default: null},
    rev_final_com: { type: String, default: null},
    emp_final_com: { type: String, default: null},
    hr_final_com: { type: String, default: null},
    final_status: { type: String, default: null},
    final_recommendation: { type: Number, default: null},
    final_remarks: { type: String, default: null},
    isExtended: { type: Boolean, default: false },
    fiscalYearId: { type: Number, default: null },
    timelines: { type: Number, default: null }
    

  },
  {
    timestamps: true,
    versionKey: false,
    _id: false
  });

// Update the Emp_id Hash user password when registering or when changing password
pipMasterSchema.pre('save', function (next) {
  var _this = this;
  if (_this.isNew) {
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
    mongoose.model('pipmaster', pipMasterSchema).find().sort({ _id: -1 }).limit(1)
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


pipMasterSchema.plugin(mongooseUniqueValidator);

module.exports = mongoose.model('pipmaster', pipMasterSchema);
