let mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  mongooseUniqueValidator = require('mongoose-unique-validator');

let PapBatchSchema = new Schema(
  {
    _id: { type: Number },
    batchName: { type: String, default: null },
    batchEndDate: { type: Date, default: new Date() + 860000 },
    status: { type: String, default: "Initiated" },
    updatedBy: { type: Number, default: null },
    createdBy: { type: Number, required: true },
    isDeleted: { type: Boolean, default: false },
    fiscalYearId: {type: Number, default: null}
  },
  {
    timestamps: true,
    versionKey: false,
    _id: false
  });

PapBatchSchema.plugin(mongooseUniqueValidator);



//Perform actions before saving the role
PapBatchSchema.pre('save', function (next) {
  var _this = this;
  if (_this.isNew) {
    mongoose.model('papBatch', PapBatchSchema).count(function (err, c) {
      _this._id = c + 1;
      next();
    });
  }
});

module.exports = mongoose.model('papBatch', PapBatchSchema);