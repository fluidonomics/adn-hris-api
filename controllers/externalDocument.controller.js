let express           = require('express'),
    EmployeeInfo      = require('../models/employee/employeeDetails.model'),
    EmployeeExternalDocumentInfo     = require('../models/employee/employeeExternalDocumentDetails.model'),
    // AuditTrail        = require('../models/common/auditTrail.model'),
    //Notification      = require('../models/common/notification.model'),
    // config            = require('../config/config'),
    // crypto            = require('crypto'),
    async             = require('async'),
    // nodemailer        = require('nodemailer'),
    // hbs               = require('nodemailer-express-handlebars'),
    // sgTransport       = require('nodemailer-sendgrid-transport'),
    // uuidV1            = require('uuid/v1');
    uploadClass       = require('../class/upload');
    AuditTrail        = require('../class/auditTrail'),
    require('dotenv').load()


function addEmployeeExternalDocumentInfoDetails(req, res, done) {
    let employeeExternalDocumentDetails = new EmployeeExternalDocumentInfo(req.body);
    employeeExternalDocumentDetails.createdBy = parseInt(req.headers.uid);

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
        AuditTrail.auditTrailEntry(employeeExternalDocumentDetails.emp_id, "employeeExternalDocumentDetails", employeeExternalDocumentDetails, "user", "employeeExternalDocumentDetails", "ADDED");
        return done(err, employeeExternalDocumentInfoData);   
    });
}

function updateEmployeeExternalDocumentInfoDetails(req, res, done) {

    let _id = req.body._id;
    var query = {
        _id: parseInt(req.body._id),
        isDeleted: false
    }

    let updateQuery={
        $set:{
            externalDocumentUrl:req.body.employeeExternalDocumentUrl
        }
    }

    EmployeeExternalDocumentInfo.findOneAndUpdate(query, updateQuery, {new: true}, function(err, employeeExternalDocumentDetailsData){
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: employeeExternalDocumentDetailsData
                }
            });
        }
        AuditTrail.auditTrailEntry(employeeExternalDocumentDetailsData.emp_id, "employeeExternalDocumentDetails", employeeExternalDocumentDetailsData._id, employeeExternalDocumentDetailsData, "updateEmployeeExternalDocumentInfoDetails", "UPDATED");
        return done(err, req);
    });
}

function deleteEmployeeExternalDocumentInfoDetails(req, res, done) {
    let _id = req.body._id;
    var query = {
        _id: parseInt(req.body._id),
    }
    EmployeeExternalDocumentInfo.remove(query,function(err, employeeExternalDocumentDetailsData){
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: employeeExternalDocumentDetailsData
                }
            });
        }
        AuditTrail.auditTrailEntry(employeeExternalDocumentDetailsData.emp_id, "employeeExternalDocumentDetails", employeeExternalDocumentDetailsData._id, employeeExternalDocumentDetailsData._id, "deleteEmployeeExternalDocumentInfoDetails", "REMOVED");
        return done(err, employeeExternalDocumentDetailsData);   
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
            "employeeExternalDocumentUrl":"$externalDocumentUrl",
            "externalDocument_id":"$externalDocument_id",
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

    updateEmployeeExternalDocumentInfo:(req,res )=> {
        async.waterfall([
          function(done) {
            uploadClass.externalpdfDocuments(req, res, (err) => {
                if (err) {
                  return res.status(403).json({
                    title: 'Error',
                    error: {
                        message: err
                    }
                  
                  });
                }
                else if (req.file !== undefined) {
                    req.body.employeeExternalDocumentUrl=req.file.key;
                    done(err,true)
                }
            });
          },
          function(data,done)
          {
            updateEmployeeExternalDocumentInfoDetails(req,res,done);
          },
          function(req,done) {
            return res.status(200).json({
                message: 'Document Image uploaded successfully!',key:req.file.key
              });
          }
        ]);
    },

    deleteEmployeeExternalDocumentInfo:(req,res )=> {
        async.waterfall([
            function(done) {
                deleteEmployeeExternalDocumentInfoDetails(req,res,done);
            },
            function(employeeExternalDocumentInfoData,done) {
              return res.status(200).json("Removed");
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