let express           = require('express'),
    EmployeeInfo      = require('../models/employee/employeeDetails.model'),
    PersonalInfo      = require('../models/employee/employeePersonalDetails.model'),
    OfficeInfo        = require('../models/employee/employeeOfficeDetails.model'),
    SupervisorInfo    = require('../models/employee/employeeSupervisorDetails.model'),
    // AuditTrail        = require('../models/common/auditTrail.model'),
    EmployeeRoles     = require('../models/employee/employeeRoleDetails.model'),
    BatchInfo         = require('../models/workflow/batch.model'),
    KraWorkFlowInfo   = require('../models/kra/kraWorkFlowDetails.model'),
    AuditTrail  = require('../class/auditTrail');
    async             = require('async');
    require('dotenv').load()


//     function auditTrailEntry(emp_id, collectionName, collectionDocument, controllerName, action, comments) {
//       let auditTrail = new AuditTrail();
//       auditTrail.emp_id = emp_id;
//       auditTrail.collectionName = collectionName;
//       auditTrail.document_id = collectionDocument._id;
//       auditTrail.document_values = JSON.stringify(collectionDocument);
//       auditTrail.controllerName = controllerName;
//       auditTrail.action = action;
//       auditTrail.comments = comments;
//       auditTrail.save();
//   }
  
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
        AuditTrail.auditTrailEntry(0, "batchDetails", batchDetails, "user", "batchDetails", "ADDED");
        return done(err, batchInfoData);   
    });
}


function updateBatchInfoDetails(req, res, done) {
    let batchDetails = new BatchInfo(req.body);
    batchDetails.updatedBy = parseInt(req.headers.uid);
    BatchInfo.findOneAndUpdate({_id:parseInt(req.body._id)},batchDetails,{new: true},function(err, batchInfoData) {
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
          AuditTrail.auditTrailEntry(0, "batchDetails", batchDetails, "user", "batchDetails", "UPDATED");
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


function updateKraWorkFlowInfoDetails(req, res,done) {
    let batch_id= req.query.batch_id;
    let query={_id:parseInt(req.body._id),isDeleted:false}
    if(batch_id)
    {
       query={batch_id:parseInt(req.query.batch_id),isDeleted:false}
    }
    let queryUpdate={ $set: {"status":req.body.status, "updatedBy":parseInt(req.headers.uid) }};

    KraWorkFlowInfo.update(query,queryUpdate,{new: true}, function(err, kraWorkFlowInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: kraWorkFlowInfoData
                }
            });
        }
        AuditTrail.auditTrailEntry(kraWorkFlowInfoData.emp_id, "kraWorkFlowDetails", kraWorkFlowInfoData, "Kra", "kraWorkFlowDetails", "UPDATED");
        return done(err, kraWorkFlowInfoData);
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

    updateBatchInfo:(req,res )=> {
        async.waterfall([
          function(done) {
                if(req.body.status=='Terminated' && req.body.batchType)
                {
                  async.waterfall([
                        function(done){
                               if(req.body.batchType=="KRA")
                                 {  
                                    req.query.batch_id=req.body._id;
                                    updateKraWorkFlowInfoDetails(req,res,done);
                                 }
                               else
                               done(null,null)
                        },
                        function(batchInfoData,done)
                        {
                            updateBatchInfoDetails(req,res,done);
                        },
                        function(batchInfoData,done)
                        {
                            return res.status(200).json(batchInfoData);
                        },
                   ]);
                }
                else{ 
                    updateBatchInfoDetails(req,res,done);
                }
          },
          function(batchInfoData,done) {
            return res.status(200).json(batchInfoData);
          }
        ]);
    },

}
module.exports = {functions,addBatchInfoDetails};

