let mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  mongooseUniqueValidator = require('mongoose-unique-validator');

let PapDetailsSchema = new Schema(
  {
    _id: { type: Number },
    updatedBy: { type: Number, default: null },
    createdBy: { type: Number, required: true },
    isDeleted: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    versionKey: false,
    _id: false
  });

PapDetailsSchema.plugin(mongooseUniqueValidator);



//Perform actions before saving the role
PapDetailsSchema.pre('save', function (next) {
  var _this = this;
  if (_this.isNew) {
    mongoose.model('papDetails', PapDetailsSchema).count(function (err, c) {
      _this._id = c + 1;
      next();
    });
  }
});

module.exports = mongoose.model('papDetails', PapDetailsSchema);