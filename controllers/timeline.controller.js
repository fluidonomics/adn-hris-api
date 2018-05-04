let express           = require('express'),
    EmployeeInfo      = require('../models/employee/employeeDetails.model'),
    PersonalInfo      = require('../models/employee/employeePersonalDetails.model'),
    OfficeInfo        = require('../models/employee/employeeOfficeDetails.model'),
    SupervisorInfo    = require('../models/employee/employeeSupervisorDetails.model'),
    AuditTrail        = require('../models/common/auditTrail.model'),
    Notification      = require('../models/common/notification.model'),
    EmployeeRoles     = require('../models/employee/employeeRoleDetails.model'),
    TimelineInfo         = require('../models/timeline/timelineDetails.model'),
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
  
function addTimelineInfoDetails(req, res, done) {
  let timelineDetails = new TimelineInfo(req.body);
  timelineDetails.emp_id = req.body.emp_id || req.query.emp_id;
  timelineDetails.createdBy = 1;

timelineDetails.save(function(err, timelineInfoData) {
    if (err) {
        return res.status(403).json({
            title: 'There was a problem',
            error: {
                message: err
            },
            result: {
                message: timelineInfoData
            }
        });
    }
    auditTrailEntry(timelineDetails.emp_id, "timelineDetails", timelineDetails, "user", "timelineDetails", "ADDED");
    return done(err, timelineInfoData);   
});
}


function updateTimelineInfoDetails(req, res, done) {
  let timelineInfo = new TimelineInfo(req.body);
  timelineInfo.emp_id = req.body.emp_id || req.query.emp_id;
  timelineInfo.updatedBy = 1;

  //timelineInfo.updatedBy =req.headers[emp_id];
  let _id = req.body._id;
  var query = {
      _id: _id,
      isDeleted: false
  }

  var timelineInfoProjection = {
      createdAt: false,
      updatedAt: false,
      isDeleted: false,
      updatedBy: false,
      createdBy: false,
  };


TimelineInfo.findOneAndUpdate(query, timelineInfo, {
  new: true,
  projection: timelineInfoProjection
}, function(err, timelineInfoData) {
  if (err) {
      return res.status(403).json({
          title: 'There was a problem',
          error: {
              message: err
          },
          result: {
              message: timelineInfoData
          }
      });
  } 
  auditTrailEntry(timelineInfo.emp_id, "timelineInfo", timelineInfo, "user", "timelineInfo", "UPDATED");
  return done(err, timelineInfoData);        
});
}



function getTimelineInfoDetails(req, res) {
  let timelineworkflow_id = req.query.timelineworkflow_id;
  let query = {
      isDeleted: false
  };
  if (timelineworkflow_id) {
      query = {
        timelineWorkflow_id: timelineworkflow_id,
          isDeleted: false
      };
  }
  var timelineProjection = {
      createdAt: false,
      updatedAt: false,
      isDeleted: false,
      updatedBy: false,
      createdBy: false,
  };
  TimelineInfo.find(query, timelineProjection, function(err, timelineInfoData) {
      if (err) {
          return res.status(403).json({
              title: 'There was an error, please try again later',
              error: err
          });
      }
      return res.status(200).json({
          'data': timelineInfoData
      });
  });
}

let functions = {
    addTimelineInfo:(req,res )=> {
      async.waterfall([
        function(done) {
          addTimelineInfoDetails(req,res,done);
        },
        function(timelineInfoData,done) {
          return res.status(200).json(timelineInfoData);
        }
      ]);
    },
    updateTimelineInfo:(req,res )=> {
      async.waterfall([
        function(done) {
          updateTimelineInfoDetails(req,res,done);
        },
        function(timelineInfoData,done) {
          return res.status(200).json(timelineInfoData);
        }
      ]);
    },
    getTimelineInfo: (req, res) => {
        async.waterfall([
            function(done) {
                getTimelineInfoDetails(req, res, done);
            },
            function(timelineDetailsData, done) {
                return res.status(200).json({
                    "data": timelineDetailsData
                });
            }
        ]);
    },

}
module.exports = functions;