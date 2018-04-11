let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let UserRolesSchema = new Schema(
      {
          _id:{type:Number},
         emp_id:{type: Number,ref: 'employees'},
         role_id:{type: Number, ref: 'roles'},
         isDeleted: {type: Boolean,default:false},
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });
      //UserRolesSchema.plugin(autoIncrement, {inc_field: '_id'});

// Update the Emp_Id Hash user password when registering or when changing password
UserRolesSchema.pre('save', function (next) {
    var _this=this;
    //Check the Count of Collection and add 1 to the Count and Assign it to Emp_Id 
    mongoose.model('empRole', UserRolesSchema).count(function(err, c) {
      _this._id = c + 1;
      next();
    });
});

      UserRolesSchema.plugin(mongooseUniqueValidator);

     module.exports = mongoose.model('empRole',UserRolesSchema);
