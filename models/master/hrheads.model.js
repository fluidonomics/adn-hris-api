let mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt = require('bcrypt'),
    autoIncrement = require('mongoose-sequence')(mongoose);

let HrHeadsSchema = new Schema(
    {
        _id: { type: Number },
        company_id: { type: Number, ref: 'companies' },
        emp_id: { type: Number, ref: 'employeedetails' },
        type: { type: Number },
        isDeleted: { type: Boolean, default: false }
    },
    {
        timestamps: true,
        versionKey: false,
        _id: false
    });
//HrHeadsSchema.plugin(autoIncrement, {inc_field: '_id'});

// Update the Emp_Id Hash user password when registering or when changing password
HrHeadsSchema.pre('save', function (next) {
    var _this = this;
    if (_this.isNew) {
        //Check the Count of Collection and add 1 to the Count and Assign it to Emp_Id 
        mongoose.model('hrheads', HrHeadsSchema).find().sort({ _id: -1 }).limit(1)
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

HrHeadsSchema.plugin(mongooseUniqueValidator);

module.exports = mongoose.model('hrheads', HrHeadsSchema);
