let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let PersonalDocumentsSchema = new Schema(
      {
        _id:{type:Number},
        emp_id   :{type: Number,ref: 'employees', required: true, unique: true,},    
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
   PersonalDocumentsSchema.pre('save', function (next) {
    var _this=this;
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
    mongoose.model('personalDocuments', PersonalDocumentsSchema).count(function(err, c) {
      _this._id = c + 1;
      next();
    });
});

PersonalDocumentsSchema.plugin(mongooseUniqueValidator);

     module.exports = mongoose.model('personalDocuments',PersonalDocumentsSchema);
