let pipbatch = require("../models/pip/pipbatch"),
pipMaster = require("../models/pip/pipmaster"),
pipdetails = require("../models/pip/pipdetails"),
AuditTrail = require("../class/auditTrail"),
EmployeeSupervisorDetails = require("../models/employee/employeeSupervisorDetails.model");
SendEmail = require('../class/sendEmail'),
EmployeeDetails = require("../models/employee/employeeDetails.model");



function InitiatePip(req, res) {
let createdby = parseInt(req.body.createdBy);
let pipBatchDetails = new pipbatch();
pipBatchDetails.batchName =req.body.batchName;
pipBatchDetails.batchEndDate = new Date(
    new Date(req.body.batchEndDate).getTime());
pipBatchDetails.status = req.body.status;
pipBatchDetails.isDeleted = false;
pipBatchDetails.createdby=createdby;
let emp_id_array = req.body.emp_id_array;
pipBatchDetails.save(function(err, pipBatchresp){

        if (err) {
            return res.status(403).json({
              title: "There was a problem",
              error: {
                message: err
              },
              result: {
                message: pipBatchresp
              }
            });
          } else {
            AuditTrail.auditTrailEntry(
              0,
              "pipBatchDetails",
              pipBatchresp,
              "user",
              "pipBatchDetails",
              "ADDED"
            );
            let batch_id = pipBatchresp.id;
            Promise.all([
                pipMaster.aggregate([
                {
                  $sort: {
                    _id: -1.0
                  }
                },
                {
                  $project: {
                    _id: "$_id"
                  }
                },
                {
                  $limit: 1.0
                }
              ]).exec()
            ]).then(function (counts) {
              let insertData = [];
              let pipMaster_id =
                counts[0][0] === undefined ? 0 : counts[0][0]._id;
              emp_id_array.forEach(function (element, index) {
                insertData.push({
                  batch_id: batch_id,
                  emp_id: element,
                  status: "Initiated",
                  _id: pipMaster_id + (index + 1),
                  createdBy: createdby
                });
              });
              pipMaster.insertMany(insertData, function (
                err,
                pipMasterResult
              ) {
                if (err) {
                  return res.status(403).json({
                    title: "There was a problem",
                    error: {
                      message: err
                    },
                    result: {
                      message: pipMasterResult
                    }
                  });
                } else {
                  AuditTrail.auditTrailEntry(
                    0,
                    "pipMaster",
                    insertData,
                    "user",
                    "pipMaster",
                    "ADDED"
                  );
    
                  return res.status(200).json({ result: pipMasterResult });
                }
              });
            });
          }
        });
    }


    


let functions = {
    initiatePipProcess: (req, res) => {
        InitiatePip(req, res);
    }

    // getLearningForSingleEmployee: (req, res) => {
    //   GetLearningSingleEmployee(req, res);
    // },

    // postNewLearning: (req, res) => {
    //   InsertLearning(req, res);
    // },

    // getLearningDetailsSingleEmployee: (req, res) => {
    //   GetLearningDetailsEmployee(req, res);
    // },

    // getLearningForSuperviser: (req, res) => {
    //   getLearningBySupervisor(req, res);                  
    // },

    // submitLearning: (req, res) => {
    //   submitEmployeeLearning(req, res);
    // },

    // learningByReviewer: (req, res) => {
    //   getLearningByReviewer(req, res);
    // },

    // learningApproval: (req, res) => {
    //   getLearningApproval(req, res);
    // },

    // updateBatch: (req, res) => {
    //   updateBatch(req, res);
    // },

    // getLearningBatch: (req, res) => {
    //   getLearningBatch(req, res);
    // }

};

module.exports = functions;