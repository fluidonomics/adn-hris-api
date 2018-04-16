let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let AddressSchema = new Schema(
      {
         _id:{type:Number},
         emp_id:{type: Number,ref: 'employees'},
         permanentAddressLine1 : {type: String, default:null},
         permanentAddressThana_id : {type: Number, default:null},
         permanentAddressDistrict_id : {type: Number, default:null},
         permanentAddressDivision_id : {type: Number, default:null},
         permanentAddressPostCode : {type: Number, default:null},
         
         currentAddressLine1 : {type: String, default:null},
         currentAddressLine2 : {type: String, default:null},
         currentAddressThana_id : {type: Number, default:null},
         currentAddressDistrict_id : {type: Number, default:null},
         currentAddressDivision_id : {type: Number, default:null},
         currentAddressPostCode : {type: Number, default:null},
         isSameAsCurrent : {type: String, default:null},
         isActive: {type: Boolean,default:true},
         updatedBy: {type: Number, default:null},
         createdBy: {type: Number, required: true}
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });
      //UserRolesSchema.plugin(autoIncrement, {inc_field: '_id'});

   // Update the Emp_Id Hash user password when registering or when changing password
    AddressSchema.pre('save', function (next) {
    var _this=this;
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_Id 
    mongoose.model('address', AddressSchema).count(function(err, c) {
      _this._id = c + 1;
      next();
    });
});

AddressSchema.plugin(mongooseUniqueValidator);

     module.exports = mongoose.model('address',AddressSchema);
