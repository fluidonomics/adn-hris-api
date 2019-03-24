let mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  mongooseUniqueValidator = require('mongoose-unique-validator');

let PapMasterSchema = new Schema(
  {
    _id: { type: Number },
    batch_id: { type: Number, ref: 'papBatch' },
    emp_id: { type: Number, ref: 'employeedetails' },
    status: { type: String, default: 'Initiated' },
    mtr_master_id: { type: Number, ref: 'midtermmaster' },
    isRatingCommunicated: { type: Boolean, default: false },
    updatedBy: { type: Number, default: null },
    createdBy: { type: Number, required: true },
    isDeleted: { type: Boolean, default: false },
    grievanceStatus: { type: String, default: null },
    reviewerStatus: { type: String, default: null },
    overallRating: { type: Number, default: null }
  },
  {
    timestamps: true,
    versionKey: false,
    _id: false
  });

PapMasterSchema.plugin(mongooseUniqueValidator);



//Perform actions before saving the role
PapMasterSchema.pre('save', function (next) {
  var _this = this;
  if (_this.isNew) {
    mongoose.model('papMaster', PapMasterSchema).count(function (err, c) {
      _this._id = c + 1;
      next();
    });
  }
});

module.exports = mongoose.model('papMaster', PapMasterSchema);