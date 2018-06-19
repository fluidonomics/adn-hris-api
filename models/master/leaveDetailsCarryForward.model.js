let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let LeaveDetailsCarryForwardSchema = new Schema(
      {
        _id: {type:Number},
        emp_id:{type: Number,ref:'employeedetails'},    
        sickLeavelapsed :     {type: Number, default:null},
        annualLeavelapsed :     {type: Number, default:null},
        annualLeaveencahsed :     {type: Number, default:null},
        annualLeaveCarryForward: {type: Number, default:null},
        fiscalYearId: {type: Number,ref:'financialYear'},       
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

      LeaveDetailsCarryForwardSchema.plugin(mongooseUniqueValidator);

      //Perform actions before saving the role
      LeaveDetailsCarryForwardSchema.pre('save', function (next) {
        var _this=this;
        if (_this.isNew) {
            mongoose.model('leaveDetailsCarryForward', LeaveDetailsCarryForwardSchema).count(function(err, c) {
                  _this._id = c + 1;
                  next();
            });
        }
      });

     module.exports = mongoose.model('leaveDetailsCarryForward',LeaveDetailsCarryForwardSchema);

