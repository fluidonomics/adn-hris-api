let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let EmployeeSalaryDetailsSchema = new Schema(
      {
        _id:{type:Number},
        emp_id   :{type: Number,ref: 'employeedetails', required: true},    
        basic : {type: String,default:null}, 
        hra : {type: String,default:null}, 
        conveyanceAllowance : {type: String,default:null}, 
        lfa : {type: String,default:null}, 
        medicalAllowance : {type: String,default:null}, 
        specialAllowance : {type: String,default:null}, 
        grossSalary : {type: String,default:null}, 
        lunchAllowance : {type: String,default:null}, 
        mobileAllowance : {type: String,default:null}, 
        otherAllowance : {type: String,default:null}, 
        totalEarnings : {type: String,default:null},      
        festivalAllowance : {type: String,default:null}, 
        providentFundMembership : {type: String,default:null}, 
        groupLifeInsurance : {type: String,default:null}, 
        hospitalizationScheme : {type: String,default:null},        
        isSalaryHike : {type: Boolean,default:false},
        isActive : {type: Boolean,default:true},
        isCompleted: {type: Boolean,default:false},
        createdBy: {type: Number,default:null},
        updatedBy: {type: Number,default:null},
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

   // Update the Emp_id Hash user password when registering or when changing password
   EmployeeSalaryDetailsSchema.pre('save', function (next) {
    var _this=this;
    if (_this.isNew) {
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
    mongoose.model('employeeSalaryDetails', EmployeeSalaryDetailsSchema).find().sort({_id:-1}).limit(1)
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

EmployeeSalaryDetailsSchema.plugin(mongooseUniqueValidator);

  module.exports = mongoose.model('employeeSalaryDetails',EmployeeSalaryDetailsSchema );
