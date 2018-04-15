let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let FamilyDetailsSchema = new Schema(
      {
        _id:{type:Number},
        emp_id   :{type: Number,ref: 'employees', required: true, unique: true,},    
        name     : {type: String,required:true},
        relation_id : {type: Number,default:null}, 
        dob      : {type: String,default:null},
        contact  : {type: String,default:null},
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
   FamilyDetailsSchema.pre('save', function (next) {
    var _this=this;
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_id 
    mongoose.model('familyDetails', FamilyDetailsSchema).count(function(err, c) {
      _this._id = c + 1;
      next();
    });
});

FamilyDetailsSchema.plugin(mongooseUniqueValidator);

     module.exports = mongoose.model('familyDetails',FamilyDetailsSchema);
