let express           = require('express'),
    EmployeeInfo      = require('../models/employee/employeeDetails.model'),
    PersonalInfo      = require('../models/employee/employeePersonalDetails.model'),
    OfficeInfo        = require('../models/employee/employeeOfficeDetails.model'),
    SupervisorInfo    = require('../models/employee/employeeSupervisorDetails.model'),
    AuditTrail        = require('../models/common/auditTrail.model'),
    EmployeeRoles     = require('../models/employee/employeeRoleDetails.model'),
    BatchInfo         = require('../models/workflow/batch.model'),
    // config            = require('../config/config'),
    // crypto            = require('crypto'),
    async             = require('async');
    // nodemailer        = require('nodemailer'),
    // hbs               = require('nodemailer-express-handlebars'),
    // sgTransport       = require('nodemailer-sendgrid-transport'),
    // uuidV1            = require('uuid/v1');
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
  
function addBatchInfoDetails(req, res, done) {
  let batchDetails = new BatchInfo(req.body);
  batchDetails.createdBy = parseInt(req.headers.uid);

    batchDetails.save(function(err, batchInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: batchInfoData
                }
            });
        }
        auditTrailEntry(0, "batchDetails", batchDetails, "user", "batchDetails", "ADDED");
        return done(err, batchInfoData);   
    });
}

function getBatchInfoDetails(req, res,done) {
  let batchworkflow_id = req.query.batchworkflow_id;
  let query = {
      isDeleted: false
  };
  if (batchworkflow_id) {
      query = {
        batchWorkflow_id: batchworkflow_id,
          isDeleted: false
      };
  }
  BatchInfo.find(query, function(err, batchInfoData) {
      if (err) {
          return res.status(403).json({
              title: 'There was an error, please try again later',
              error: err
          });
      }
      return done(err, batchInfoData);   
     
  });
}

let functions = {
    addBatchInfo:(req,res )=> {
      async.waterfall([
        function(done) {
          addBatchInfoDetails(req,res,done);
        },
        function(batchInfoData,done) {
          return res.status(200).json(batchInfoData);
        }
      ]);
    },
    
    getBatchInfo: (req, res) => {
        async.waterfall([
            function(done) {
                getBatchInfoDetails(req, res, done);
            },
            function(batchDetailsData, done) {
            return res.status(200).json({
                    "data": batchDetailsData
                });
            }
        ]);
    },

}
module.exports = {functions,addBatchInfoDetails};

