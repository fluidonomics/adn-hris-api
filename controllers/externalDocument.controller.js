let express           = require('express'),
    EmployeeInfo      = require('../models/employee/employeeDetails.model'),
    EmployeeExternalDocumentInfo     = require('../models/employee/employeeExternalDocumentDetails.model'),
    AuditTrail        = require('../models/common/auditTrail.model'),
    Notification      = require('../models/common/notification.model'),
    config            = require('../config/config'),
    crypto            = require('crypto'),
    async             = require('async'),
    nodemailer        = require('nodemailer'),
    hbs               = require('nodemailer-express-handlebars'),
    sgTransport       = require('nodemailer-sendgrid-transport'),
    uuidV1            = require('uuid/v1');
    require('dotenv').load()


    function auditTrailEntry(emp_id, collectionName, collectionDocument, controllerName, action, comments) {
      let auditTrail = new AuditTrail();
      auditTrail.emp_id = emp_id;
      auditTrail.collectionName = collectionName;
      auditTrail.document_id = collectionDocument._id;
      auditTrail.document_values = JSON.stringify(collectionDocument);
      auditTrail.controllerName = controllerName;
      auditTrail.action = action;
      auditTrail.comments = comments;
      auditTrail.save();
  }
  
function addEmployeeExternalDocumentInfoDetails(req, res, done) {
  let employeeExternalDocumentDetails = new EmployeeExternalDocumentInfo(req.body);
  employeeExternalDocumentDetails.createdBy = 1;

employeeExternalDocumentDetails.save(function(err, employeeExternalDocumentInfoData) {
    if (err) {
        return res.status(403).json({
            title: 'There was a problem',
            error: {
                message: err
            },
            result: {
                message: employeeExternalDocumentInfoData
            }
        });
    }
    auditTrailEntry(employeeExternalDocumentDetails.emp_id, "employeeExternalDocumentDetails", employeeExternalDocumentDetails, "user", "employeeExternalDocumentDetails", "ADDED");
    return done(err, employeeExternalDocumentInfoData);   
});
}






function getEmployeeExternalDocumentInfoDetails(req, res) {
    let emp_id = req.query.emp_id;
    EmployeeExternalDocumentInfo.aggregate([
        {
              "$lookup": {
                  "from": "documents",
                  "localField": "externalDocument_id",
                  "foreignField": "_id",
                  "as": "documents"
              }
        },
        {
            "$unwind": "$documents"
        },
        
        { "$match": { "emp_id":parseInt(emp_id),"isDeleted":false,"documents.isDeleted":false} },
        {"$project":{
            "_id":"$_id",
            "emp_id":"$emp_id",
            "employteeExternalDocumentUrl":"$externalDocumentUrl",
            "document_id":"$documents._id",
            "documentName":"$documents.documentName",
            "documentUrl":"$documents.documentUrl"
        }}
      ]).exec(function(err, employeeExternalDocumentInfoData){
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err
            });
        }
        return res.status(200).json(employeeExternalDocumentInfoData);
      })
}




// function getEmployeeExternalDocumentInfoDetails(req, res) {
//   let emp_id = req.query.emp_id;
//   let query = {
//       isDeleted: false
//   };
//   if (emp_id) {
//       query = {
//         emp_id: emp_id,
//           isDeleted: false
//       };
//   }
//   var employeeExternalDocumentProjection = {
//       createdAt: false,
//       updatedAt: false,
//       isDeleted: false,
//       updatedBy: false,
//       createdBy: false,
//   };
//   EmployeeExternalDocumentInfo.find(query, employeeExternalDocumentProjection, function(err, employeeExternalDocumentInfoData) {
//       if (err) {
//           return res.status(403).json({
//               title: 'There was an error, please try again later',
//               error: err
//           });
//       }
//       return res.status(200).json(employeeExternalDocumentInfoData);
//   });
// }

let functions = {
    addEmployeeExternalDocumentInfo:(req,res )=> {
      async.waterfall([
        function(done) {
          addEmployeeExternalDocumentInfoDetails(req,res,done);
        },
        function(employeeExternalDocumentInfoData,done) {
          return res.status(200).json(employeeExternalDocumentInfoData);
        }
      ]);
    },
    
    getEmployeeExternalDocumentInfo: (req, res) => {
        async.waterfall([
            function(done) {
                getEmployeeExternalDocumentInfoDetails(req, res, done);
            },
            function(employeeExternalDocumentDetailsData, done) {
                return res.status(200).json(employeeExternalDocumentDetailsData);
            }
        ]);
    },

}
module.exports = functions;