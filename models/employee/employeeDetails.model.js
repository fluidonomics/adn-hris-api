let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt'),
    async       = require('async');
    

    let EmployeeDetailsSchema = new Schema(
    {
      _id:{ type:Number },
      fullName:{type: String, required: true}, 
      userName:{type: String, unique: true},
      password:{type: String, required: true},
      profileImage: {type: String, default:null},
      company_id:{type: Number,required: true}, 
      employmentType_id : {type : Number},
      designation_id :  {type : Number},
      grade_id :  {type : Number},
      resetPasswordToken : {type: String,default:null},
      resetPasswordExpires : {type: Date }, 
      isDeleted: {type: Boolean,default:false},
      isAccountActive : {type: Boolean,default:false},
      updatedBy: {type: Number, default:null},
      createdBy: {type: Number, required: true},
    },
    {
      // this will add created_at and updated_at automatically on every mongo documernt (user, forms)
      timestamps: true,
      versionKey: false,
      _id:false
    });

    // Update the Emp_Id Hash user password when registering or when changing password
    EmployeeDetailsSchema.pre('save', function (next,req) {
        var _this=this;
        if (_this.isNew) {
          //Check the Count of Collection and add 1 to the Count and Assign it to Emp_Id 
          mongoose.model('employeeDetails', EmployeeDetailsSchema).count(function(err, c) {
              //Hash the Password and assign it to Password
                _this._id = c + 1;
                //Generate EmployeeDetails Id 
                let userName = "";
                switch(_this.company_id) {
                  case 1:
                      userName = "10";
                      break;
                  case 2:
                      userName = "20";
                      break;
                  case 3:
                      userName = "30"; 
                      break;
                  case 4:
                      userName = "40";
                      break
                  default:
                      break;
                };    
                switch(req.body.managementType_id) {
                  case 1:
                      userName += "1";
                      break;
                  case 2:
                      userName += "2";
                      break;
                  default:
                      break;
                }; 
                let n = _this._id;
                userName += n < 10 ?  "000" + n : ((n > 9 && n <100) ? "00" + n : ((n > 99 && n < 1000) ? "0" + n : n ));
                _this.userName = userName;
                bcrypt.genSalt(10, function (err, salt) {
                        if (err) {
                            next(err);
                        }
                        bcrypt.hash(_this.password, salt,  (err, hash) => {
                          if (err) {
                            next(err);
                          }
                          _this.password = hash;
                          next();
                        });
                });
                next();
          });
        }
        else{
            bcrypt.genSalt(10, function (err, salt) {
                if (err) {
                    next(err);
                }
                bcrypt.hash(_this.password, salt,  (err, hash) => {
                  if (err) {
                    next(err);
                  }
                  _this.password = hash;
                  next();
                });
          });
        }
    });

    // //Find the last Sequence added to User DB
    // function getNextSequence() {
    //   var count = mongoose.model('employeeDetails', EmployeeDetailsSchema).count(function(err, c) {
    //     return c;
    //   });
    // }

    // create method to compare password upon login
    EmployeeDetailsSchema.methods.comparePassword = function (pw, cb) {
      bcrypt.compare(pw, this.password, function (err, isMatch) {
        if (err) {
          return cb(err);
        }
        cb(null, isMatch);
      });
    };

    EmployeeDetailsSchema.plugin(mongooseUniqueValidator);

    module.exports = mongoose.model('employeeDetails', EmployeeDetailsSchema);
