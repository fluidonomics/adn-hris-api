// let mongoose                = require('mongoose'),
//     Schema                  = mongoose.Schema,
//     mongooseUniqueValidator = require('mongoose-unique-validator'),
//     bcrypt                  = require('bcrypt');
//     autoIncrement           = require('mongoose-sequence')(mongoose);

//       let UserCarDetails = new Schema(
//       {
//          emp_Id:{type: Number,ref: 'employee'},
//          role_Id:{type: Number, ref: 'role'},
//          isActive: {type: Boolean,default:true},
//       },
//       {
//         timestamps: true,
//         _id:false
//       });
//       UserCarDetails.plugin(autoIncrement, {inc_field: '_id'});
//       UserCarDetails.plugin(mongooseUniqueValidator);

//      module.exports = mongoose.model('empCarDetail',UserCarDetails);
