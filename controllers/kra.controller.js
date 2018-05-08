let express           = require('express'),
    EmployeeInfo      = require('../models/employee/employeeDetails.model'),
    PersonalInfo      = require('../models/employee/employeePersonalDetails.model'),
    OfficeInfo        = require('../models/employee/employeeOfficeDetails.model'),
    SupervisorInfo    = require('../models/employee/employeeSupervisorDetails.model'),
    AuditTrail        = require('../models/common/auditTrail.model'),
    Notification      = require('../models/common/notification.model'),
    EmployeeRoles     = require('../models/employee/employeeRoleDetails.model'),
    KraInfo           = require('../models/kra/kraDetails.model'),
    KraWorkFlowInfo   = require('../models/kra/kraWorkFlowDetails.model'),
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
  

  function addKraWorkFlowInfoDetails(req, res, done) {
    let kraWorkFlowDetails = new KraWorkFlowInfo(req.body);
    kraWorkFlowDetails.emp_id = req.body.emp_id || req.query.emp_id;
    kraWorkFlowDetails.createdBy = 1;

    kraWorkFlowDetails.save(function(err, kraWorkFlowInfoData) {
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
        auditTrailEntry(kraWorkFlowDetails.emp_id, "kraWorkFlowDetails", kraWorkFlowDetails, "user", "kraWorkFlowDetails", "ADDED");
        return done(err, kraWorkFlowInfoData);   
    });
}



function getKraWorkFlowInfoDetails(req, res) {
    let _id = req.query._id;
    let query = {
        isDeleted: false
    };
    if (_id) {
        query = {
            _id: _id,
            isDeleted: false
        };
    }
    var kraWorkflowProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };
    KraWorkFlowInfo.findOne(query, kraWorkflowProjection, function(err, kraWorkflowInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err
            });
        }
        return res.status(200).json(kraWorkflowInfoData);
    });
  }


function addKraInfoDetails(i,req, res, done) {
    let kraDetails = new KraInfo(req.body[i]);
    kraDetails.save(function(err, krasData) {
        auditTrailEntry(kraDetails.emp_id, "kraDetails", kraDetails, "user", "kraDetails", "ADDED");
        if ((i + 1) < req.body.length) {
            addKraInfoDetails(i + 1, req, res, done);
        }
        else{
            return done(null,true)   
        }
    });
}


function updateKraInfoDetails(req, res, done) {
  let kraInfo = new KraInfo(req.body);
  kraDetails.kraworkflow_id =req.body.kraworkflow_id|| req.query.kraworkflow_id;
  kraInfo.updatedBy = 1;

  //kraInfo.updatedBy =req.headers[emp_id];
  let _id = req.body._id;
  var query = {
      _id: _id,
      isDeleted: false
  }

  var kraInfoProjection = {
      createdAt: false,
      updatedAt: false,
      isDeleted: false,
      updatedBy: false,
      createdBy: false,
  };


    KraInfo.findOneAndUpdate(query, kraInfo, {
    new: true,
    projection: kraInfoProjection
    }, function(err, kraInfoData) {
    if (err) {
        return res.status(403).json({
            title: 'There was a problem',
            error: {
                message: err
            },
            result: {
                message: kraInfoData
            }
        });
    } 
    auditTrailEntry(kraInfo.emp_id, "kraInfo", kraInfo, "user", "kraInfo", "UPDATED");
    return done(err, kraInfoData);        
    });
}


function getKraInfoDetailsData(req, res) {
    let emp_id=req.query.emp_id;
    KraWorkflow.aggregate([
        {
            "$lookup": {
                "from": "kradetails",
                "localField": "_id",
                "foreignField": "kraWorkflow_id",
                "as": "kradetails"
            }
        },
        {"$match": {"isDeleted":false,"emp_id":parseInt(emp_id)} },
        {"$project":{
            "_id":"$_id",
            "batch_id":"$batch_id",
            "timeline_id":"$timeline_id",
            "emp_id":"$emp_id",
            "status":"$status",
            "kraDetails":"$kradetails"
            }}
        ]).exec(function(err, results){
        if(err)
        {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: results
                }
            });
        } 
        return res.status(200).json({"data":results});
     });
}



function getKraInfoDetails(req, res) {
  let kraworkflow_id = req.query.kraworkflow_id;
  let query = {
      isDeleted: false
  };
  if (kraworkflow_id) {
      query = {
        kraWorkflow_id: kraworkflow_id,
          isDeleted: false
      };
  }
  var kraProjection = {
      createdAt: false,
      updatedAt: false,
      isDeleted: false,
      updatedBy: false,
      createdBy: false,
  };
  KraInfo.find(query, kraProjection, function(err, kraInfoData) {
      if (err) {
          return res.status(403).json({
              title: 'There was an error, please try again later',
              error: err
          });
      }
      return res.status(200).json({
          'data': kraInfoData
      });
  });
}

let functions = {
    addKraWorkFlowInfo:(req,res )=> {
        async.waterfall([
          function(done) {
            addKraWorkFlowInfoDetails(req,res,done);
          },
          function(kraWorkFlowInfoData,done) {
            return res.status(200).json(kraWorkFlowInfoData);
          }
        ]);
      },

      getKraWorkFlowInfo: (req, res) => {
        async.waterfall([
            function(done) {
                getKraWorkFlowInfoDetails(req, res, done);
            },
            function(kraWorkflowDetailsData, done) {
                return res.status(200).json({
                    "data": kraWorkflowDetailsData
                });
            }
        ]);
    },


    addKraInfo:(req,res )=> {
      async.waterfall([
        function(done) {
          addKraInfoDetails(0,req,res,done);
        },
        function(kraInfoData,done) {
          return res.status(200).json(kraInfoData);
        }
      ]);
    },
    updateKraInfo:(req,res )=> {
      async.waterfall([
        function(done) {
          updateKraInfoDetails(req,res,done);
        },
        function(kraInfoData,done) {
          return res.status(200).json(kraInfoData);
        }
      ]);
    },
    getKraInfo: (req, res) => {
        async.waterfall([
            function(done) {
                getKraInfoDetails(req, res, done);
            },
            function(kraDetailsData, done) {
                return res.status(200).json({
                    "data": kraDetailsData
                });
            }
        ]);
    },


    getKraDetailsData: (req, res) => {
        async.waterfall([
            function(done) {
                getKraInfoDetailsData(req, res, done);
            },
            function(kraDetailsData, done) {
                return res.status(200).json({
                    "data": kraDetailsData
                });
            }
        ]);
    },



}
module.exports = functions;