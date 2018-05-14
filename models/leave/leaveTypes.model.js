let mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt = require('bcrypt');
autoIncrement = require('mongoose-sequence')(mongoose);

let LeaveTypesSchema = new Schema({
    _id: { type: Number },
    type: { type: String },
    updatedAt: { type: Date, default: null },
    createdAt: { type: Date, default: null },
    updatedBy: { type: Number, default: null },
    createdBy: { type: Number, default: null },
    isDeleted: { type: Boolean, default: null }
},
    {
        timestamps: true,
        versionKey: false,
        _id: false
    }
);
//LeaveTypesSchema.plugin(mongooseUniqueValidator);

//Perform actions before saving the bank details
//   LeaveTypesSchema.pre('save', function (next) {
//     var _this=this;
//     if (_this.isNew) {
//         mongoose.model('leavetypes', LeaveTypesSchema).count(function(err, c) {
//               _this._id = c + 1;
//               next();
//         });
//     }
//   });

module.exports = mongoose.model('leavetypes', LeaveTypesSchema, 'leaveTypes');