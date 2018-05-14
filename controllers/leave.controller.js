let express = require('express'),

    LeaveApply = require('../models/leave/leaveApply.model'),
    LeaveTransactionType = require('../models/leave/leaveTransactioType.model');
    PersonalInfo      = require('../models/employee/employeePersonalDetails.model'),
    LeaveTypes = require('../models/leave/leaveTypes.model');
config = require('../config/config'),
    crypto = require('crypto'),
    async = require('async'),
    nodemailer = require('nodemailer'),
    hbs = require('nodemailer-express-handlebars'),
    sgTransport = require('nodemailer-sendgrid-transport'),
    uuidV1 = require('uuid/v1');
require('dotenv').load()
function applyLeave(req, res, done) {
    let leavedetails = new LeaveApply(req.body);
    leavedetails.emp_id = req.body.emp_id || req.query.emp_id;
    leavedetails.createdBy = parseInt(req.headers.uid);
    leavedetails.fromDate = new Date(req.body.fromDate);
    leavedetails.toDate = new Date(req.body.toDate);
    leavedetails.save(function (err, leavesInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There is a problem',
                error: {
                    message: err
                },
                result: {
                    message: leavesInfoData
                }
            });
        }
        return done(err, leavesInfoData);
    });

}
function getAllEmployeeEmails(req, res) {
    let query = {
        isDeleted: false
    };
    var personalInfoProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
        emergencyContactNumber: false,
        emergencyContactPerson: false,
        maritialStatus: false,
        fatherName: false,
        motherName: false,
        homePhone: false,
        nationality: false,
        religion: false,
        bloodGroup: false,
        dob: false,
        personalMobileNumber: false,
        isCompleted: false
    };
    PersonalInfo.find(query, personalInfoProjection, function(err, personalEmpDetails) {
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err
            });
        }
        // var finalResponse;
        // finalResponse._id = personalEmpDetails._id;
        // finalResponse.emp_id = personalEmpDetails.emp_id;
        // finalResponse.personalEmail = personalEmpDetails.personalEmail;
        return res.status(200).json(personalEmpDetails);
    });
}
let functions = {
    postApplyLeave: (req, res) => {
        async.waterfall([
            function (done) {
                applyLeave(req, res, done);
            },
            function (kraWorkFlowInfoData, done) {
                return res.status(200).json(kraWorkFlowInfoData);
            }
        ])
    },
    getLeaveTypes: (req, res) => {
        let query = {
            'isDeleted': false
        };
        LeaveTypes.find(query, function (err, leaveTypesData) {
            if (leaveTypesData) {
                return res.status(200).json(leaveTypesData);
            }
            return res.status(403).json({
                title: 'Error',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });
        })
    },
     getLeaveTransaction: (req, res) => {
         let query = {
             isDeleted: false
         }
         var transactionProjection = {
             createdAt: false,
             updatedAt: false,
             isDeleted: false,
             updatedBy: false,
             createdBy: false,
         };
         LeaveTransactionType.find(query, transactionProjection, {
             sort: {
                 _id: 1
             }
         }, function (err, leaveTransactionTypeData) {
             if (leaveTransactionTypeData) {
                 return res.status(200).json(leaveTransactionTypeData);
             }
             return res.status(403).json({
                 title: 'Error',
                 error: {
                     message: err
                 },
                 result: {
                     message: result
                 }
             });
         })
     },
    getEmployeeLeaveDetails: (req, res) => {
        LeaveApply.aggregate([
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "emp_id",
                    "foreignField": "_id",
                    "as": "emp_name"
                }
            },
            {
              "$unwind": "$emp_name"
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "applyTo",
                    "foreignField": "_id",
                    "as": "sup_name"
                }
            },
            {
              "$unwind": "$sup_name"
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "cancelLeaveApplyTo",
                    "foreignField": "_id",
                    "as": "cancelLeave_ApplyTo"
                }
            },
            {
              "$unwind":{
                  path: "$cancelLeave_ApplyTo",
              "preserveNullAndEmptyArrays": true}
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "ccTo",
                    "foreignField": "_id",
                    "as": "ccTo_user"
                }
            },
            {
              "$unwind": {
                path: "$ccTo_user",
            "preserveNullAndEmptyArrays": true}
            
            },
            {"$match": {"isDeleted":false, "emp_id" : parseInt( req.query.emp_id)} },
            {"$project":{
                "_id":"$_id",
                "emp_id":"$emp_id",
                "emp_name":"$emp_name.userName",
                "leave_type":"$leave_type",
                "forwardTo":"$forwardTo",
                "remark":"$remark",
                "cancelLeaveApplyTo":"$cancelLeaveApplyTo",
                "cancelLeaveApplyTo_name":"$cancelLeave_ApplyTo.userName",
                "cancelReason":"$cancelReason",
                "isCancelled":"$isCancelled",
                "isApproved":"$isApproved",
                "ccTo":"$ccTo",
                "ccTo_name":"$ccTo_user.userName",
                "contactDetails":"$contactDetails",
                "applyTo":"$applyTo",
                "applyTo_name":"$sup_name.userName",
                "toDate":"$toDate",
                "fromDate":"$fromDate"
                
              }}
            
    ]).exec(function(err, results){
        if(err){
            return res.status(403).json({
                title: 'There is a problem',
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
    },
    getAllEmployeeEmails: (req, res) => {
        getAllEmployeeEmails(req, res);
    },
}

module.exports = functions;