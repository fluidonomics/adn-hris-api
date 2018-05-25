let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let EmployeeDocumentDetailsSchema = new Schema(
      {
        _id:{type:Number},
        emp_id   :{type: Number,ref: 'employeedetails', required: true, unique: true,},    
        nationalIdSmartCard : {type: String,default:null}, 
        nationalIdSmartCardDocURL : {type: String,default:null}, 
        passportNumber : {type: String,default:null}, 
        passportNumberDocURL : {type: String,default:null}, 
        birthRegistrationNumber : {type: String,default:null}, 
        birthRegistrationNumberDocURL : {type: String,default:null}, 
        nationalIDOldFormat : {type: String,default:null}, 
        nationalIDOldFormatDocURL : {type: String,default:null},  
        isCompleted: {type: Boolean,default:false},
        createdBy: {type: Number,default:null},
        updatedBy: {type: Number,default:null},
        isDeleted: {type: Boolean,default:false},
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

   // Update the Emp_id Hash user password when registering or when changing password
   EmployeeDocumentDetailsSchema.pre('save', function (next) {
    var _this=this;
    if (_this.isNew) {
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
    mongoose.model('employeeDocumentDetails', EmployeeDocumentDetailsSchema).find().sort({_id:-1}).limit(1)
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

EmployeeDocumentDetailsSchema.plugin(mongooseUniqueValidator);

     module.exports = mongoose.model('employeeDocumentDetails',EmployeeDocumentDetailsSchema);
