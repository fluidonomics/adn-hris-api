let mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt = require('bcrypt'),
    autoIncrement = require('mongoose-sequence')(mongoose);

let PapRatigScaleSchema = new Schema(
    {
        _id: { type: Number },
        ratingScale: { type: String, required: true, unique: true },
        nomenclature: { type: String },
        definition: { type: String },
        differentiator: { type: String },
        updatedBy: { type: Number, default: null },
        createdBy: { type: Number, required: true },
        isDeleted: { type: Boolean, default: false }
    },
    {
        timestamps: true,
        versionKey: false,
        _id: false
    });

PapRatigScaleSchema.plugin(mongooseUniqueValidator);

//Perform actions before saving the role
PapRatigScaleSchema.pre('save', function (next) {
    var _this = this;
    if (_this.isNew) {
        mongoose.model('papRatingScale', PapRatigScaleSchema).count(function (err, c) {
            _this._id = c + 1;
            next();
        });
    }
});

module.exports = mongoose.model('papRatingScale', PapRatigScaleSchema);