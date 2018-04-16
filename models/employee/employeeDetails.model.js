let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt'),
    async       = require('async');
    

    let UserSchema = new Schema(
    {
      _id:{ type:Number },
      fullName:{type: String, required: true}, 
      //officeEmail: {type: String, default:null, lowercase: true},
      userName:{type: String, unique: true},
      password:{type: String, required: true},
      company_id:{type: Number,required: true}, 
      updatedBy: {type: Number, default:null},
      createdBy: {type: Number, required: true},
      profileImage: {type: String, default:null},
      employmentType_id : {type : Number},
      designation_id :  {type : Number},
      grade_id :  {type : Number},
      resetPasswordToken : {type: String,default:null},
      resetPassword : {type: Boolean,default:false},
      resetPasswordExpires : {type: Date }, 
      isDeleted: {type: Boolean,default:false},
    },
    {
      // this will add created_at and updated_at automatically on every mongo documernt (user, forms)
      timestamps: true,
      versionKey: false,
      _id:false
    });
    //UserSchema.plugin(autoIncrement, {inc_field: 'emp_id'});
    


      // let UserRoleSchema = new Schema(
      // {
      //    Emp_Id:{type: Number, required: true},
      //    Role_Id:{type: Number, required: true},
      //    IsActive: {type: Boolean,default:true},
      // },
      // {
      //   timestamps: true
      // });
      //UserRoleSchema.plugin(autoIncrement, {inc_field: 'EmpRoles_Id'});


      // let UserCarDetails = new Schema(
      // {
      //   Emp_Id:{type: Number, required: true},
      //   CompanyRegistrationNumber: {type: String, default:null},
      //   CompanyEffectiveDate: {type: Date, default:null},
      //   CompanyExpiryDate: {type: Date, default:null},
      //   CompanyFuelAllowance: {type: String, default:null},
      //   CompanyMaintenanceAllowance:  {type: String, default:null},
      //   CompanyDriverAllowance:  {type: String, default:null},
      //   CompanyGrossPay:  {type: String, default:null},
      //   PrivateRegistrationNumber:  {type: String, default:null},
      //   PrivateEffectiveDate:  {type: Date, default:null},
      //   PrivateExpiryDate:  {type: Date, default:null},
      //   PrivateCarUsageAllowance:  {type: String, default:null},
      //   CreatedBy:  {type: Number, default:null},
      //   UpdatedBy:  {type: Number, default:null},
      // },
      // {
      //   timestamps: true
      // });
      //UserCarDetailsSchema.plugin(autoIncrement, {inc_field: 'EmpCarDetails_Id'});
      

      // let UserPerformanceRating = new Schema(
      // {
      //     Emp_Id: {type: Number, required: true},,
      //     PerformanceRating_Id: {type: Number, required: true},
      //     PerformanceRating: {type: Number, default:null},
      //     CreatedBy: {type: Number, required: true},
      //     UpdatedBy: {type: Number, default:null},
      // },
      // {
      //   timestamps: true
      // });
      //UserPerformanceRatingSchema.plugin(autoIncrement, {inc_field: 'EmpPerformanceRating_Id'});
      

      // let UserSepreationSchema = new Schema(
      // {
      //     Emp_Id: 1,
      //     DateOfResignation: null,
      //     DateOfSeparation: null,
      //     EffectiveDate: null,
      //     SeparationType: null,
      //     CreatedBy: null,
      //     UpdatedBy: null,
      // },,
      // {
      //   timestamps: true
      // });
      //UserSepreationSchema.plugin(autoIncrement, {inc_field: 'EmpSepration_Id'});
      

      // let UserAuditTrail = new Schema(
      // {
      //   AuditTrail_Id: 1,
      //   Emp_Id: 1,
      //   RoleName: Role,
      //   TableName: null,
      //   FieldsName: null,
      //   FileName: null,
      //   ModuleName: null,
      //   AddedOn: null,
      //   UpdatedOn: null,
      //   DeletedOn: null,
      //   Remark: null,
      //   AuditDate: null
      // },,
      // {
      //   timestamps: true
      // });


      // let UserBankDetails = new Schema(
      //   {
      //     BankDetails_Id: 1,
      //     Emp_Id: 1,
      //     BankName: fdf       ,
      //     AccountName: null,
      //     AccountNumber: null,
      //     Currency_Id: null,
      //     CreatedBy: null,
      //     UpdatedBy: null,
      //     CreatedDate: null,
      //     UpdatedDate: null
      //   },,
      //   {
      //     timestamps: true
      //   });


      // let UserBatch = new Schema(
      //   {
      //     Batch_Id: 1,
      //     BatchType: test      ,
      //     BatchInitiator_Id: null,
      //     BatchEndDate: null,
      //     IsCompleted: null,
      //     IsDeleted: null,
      //     CreatedBy: null,
      //     UpdatedBy: null,
      //     CreatedDate: null,
      //     UpdatedDate: null
      //   },,
      //   {
      //     timestamps: true
      //   });

      //   let UserCertificate = new Schema(
      //     {
      //       Certificate_Id: 1,
      //       Emp_Id: 1,
      //       CertificationTitle: ad,
      //       Location: null,
      //       Institution: null,
      //       Duration: null,
      //       TopicsCovered: null,
      //       CreatedBy: null,
      //       UpdatedBy: null,
      //       CreatedDate: null,
      //       UpdatedDate: null
      //     },,
      //     {
      //       timestamps: true
      //     });

    // Update the Emp_Id Hash user password when registering or when changing password
    UserSchema.pre('save', function (next,req) {
          var _this=this;
          //Check the Count of Collection and add 1 to the Count and Assign it to Emp_Id 
          mongoose.model('employee', UserSchema).count(function(err, c) {
              //Hash the Password and assign it to Password
              if (_this.isNew) {
                _this._id = c + 1;
                
                //Generate Employee Id 
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
              }
              else if(!_this.isNew)
              {
                _this.updatedBy=req.headers.emp_id;
              }
              else {
                 next();
              }
          });
    });

//UserSchema.index({volAddressCoords: '2dsphere'});

//Find the last Sequence added to User DB
function getNextSequence() {
  var count = mongoose.model('employee', UserSchema).count(function(err, c) {
    return c;
  });
}



// create method to compare password upon login

    UserSchema.methods.comparePassword = function (pw, cb) {
      bcrypt.compare(pw, this.password, function (err, isMatch) {
        if (err) {
          return cb(err);
        }
        cb(null, isMatch);
      });
    };

    UserSchema.plugin(mongooseUniqueValidator);

    module.exports = mongoose.model('employee', UserSchema);
