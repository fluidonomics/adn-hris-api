let mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  mongooseUniqueValidator = require('mongoose-unique-validator');

let PapDetailsSchema = new Schema(
  {
    _id: { type: Number },
    pap_master_id: { type: Number, ref: 'papMaster'},
    empId: { type: Number, ref: 'employeedetails'},
    mtr_details_id: { type: Number, ref: 'midtermDetails'},
    supervisor_id: { type: Number },
    emp_ratingScaleId: { type: Number, ref: 'performanceRating', default: null},
    empRemark: { type: String, default: null},
    sup_ratingScaleId: { type: Number, ref: 'performanceRating', default: null},
    supRemark: { type: String, default: null},
    reviewerRemark: { type: String, default: null},
    status: { type: String, default: null},
    grievanceStatus: { type: String, default: null},
    grievance_ratingScaleId: { type: Number, ref: 'performanceRating', default: null},
    grievanceSupRemark: { type: String, default: null},
    grievanceRevRemark: { type: String, default: null},
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