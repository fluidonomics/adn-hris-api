let mongoose                = require('mongoose'),
    Schema                  = mongoose.Schema,
    mongooseUniqueValidator = require('mongoose-unique-validator'),
    bcrypt                  = require('bcrypt');
    autoIncrement           = require('mongoose-sequence')(mongoose);

      let RolesSchema = new Schema(
      {
        _id:{type:Number},
         roleName: {type: String,required:true},
         isActive:{type:Boolean,default:true},
         updatedBy: {type: Number, default:null},
         createdBy: {type: Number, required: true}
      },
      {
        timestamps: true,
        versionKey: false,
        _id:false
      });

      //RolesSchema.plugin(autoIncrement,{inc_field: 'role_id'});
      RolesSchema.plugin(mongooseUniqueValidator);

      // RolesSchema.pre('findOneAndUpdate', function (next) {
      //   this.setOptions({
      //     new: true,
      //     runValidators: true
      //   });
      //   this.update({}, {
      //     createdAt: Date.now()
      //   });
      //   next();
      // });

      //Perform actions before saving the role
      RolesSchema.pre('save', function (next) {
        var _this=this;
        if (_this.isNew) {
        // Update the _Id 
        mongoose.model('role', RolesSchema).count(function(err, c) {
          _this._id = c + 1;
          next();
        });
      }
      });

      // UserRolesSchema.post('findOneAndUpdate', function(result) {
      //   this.model.update({}, { 
      //       totalNumberOfComments: result.comments.length
      //   }).exec();
      // });

     module.exports = mongoose.model('role',RolesSchema);

