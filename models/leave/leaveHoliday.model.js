let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

    let LeaveHolidaySchema = new Schema({
        _id: {type:Number},
        occasion: {type: String, default: null},
        date: {type: Date,  default: null},
        day: {type: String, default: null},
        isGeneral : {type: Boolean, default: null},
        isRestricted : {type: Boolean, default: null}
    },
    {
        timestamps: true,
        versionKey: false,
        _id: false
    }
);
LeaveHolidaySchema.plugin(mongooseUniqueValidator);

  //Perform actions before saving the bank details
//   LeaveHolidaySchema.pre('save', function (next) {
//     var _this=this;
//     if (_this.isNew) {
//         mongoose.model('leaveholiday', LeaveHolidaySchema).count(function(err, c) {
//               _this._id = c + 1;
//               next();
//         });
//     }
//   });

  // Update the Emp_id Hash user password when registering or when changing password
    LeaveHolidaySchema.pre('save', function (next) {
        var _this=this;
        if (_this.isNew) {
        //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
        mongoose.model('leaveholiday', LeaveHolidaySchema).find().sort({_id:-1}).limit(1)
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

module.exports = mongoose.model('leaveholiday',LeaveHolidaySchema, 'leaveholiday');