let express = require('express'),

    LeaveApply = require('../models/leave/leaveApply.model'),
    LeaveTransactionType = require('../models/leave/leaveTransactioType.model');
PersonalInfo = require('../models/employee/employeePersonalDetails.model'),
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
    leavedetails.createdBy = parseInt(req.body.emp_id);
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
    PersonalInfo.find(query, personalInfoProjection, function (err, personalEmpDetails) {
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
function cancelLeave(req, res, done) {
    let cancelLeaveDetals = new LeaveApply(req.body);
    // LeaveApply._id = req.body.id;
    cancelLeaveDetals.updatedBy = req.body.emp_id;
    cancelLeaveDetals.cancelReason = req.body.reason;
    cancelLeaveDetals.ccTo = req.body.CCto;
    var query = {
        _id: parseInt(req.body.id),
        isDeleted: false
    }

    var leaveProjection = {
        createdAt: false,
        updatedAt: false,
        isDeleted: false,
        updatedBy: false,
        createdBy: false,
    };

    LeaveApply.findOneAndUpdate(query, cancelLeaveDetals, {
        new: true,
        projection: leaveProjection
    }, function (err, _leaveDetails) {
        if (err) {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: _leaveDetails
                }
            });
        }
        return done(err, _leaveDetails);
    })

}
let functions = {
    postApplyLeave: (req, res) => {
        async.waterfall([
            function (done) {
                applyLeave(req, res, done);
            },
            function (_applyLeaveDetails, done) {
                return res.status(200).json(_applyLeaveDetails);
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
                "$unwind": {
                    path: "$emp_name",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "forwardTo",
                    "foreignField": "_id",
                    "as": "forwardTo_name"
                }
            },
            {
                "$unwind": {
                    path: "$forwardTo_name",
                    "preserveNullAndEmptyArrays": true
                }
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
                "$unwind": {
                    path: "$sup_name",
                    "preserveNullAndEmptyArrays": true
                }
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
                "$unwind": {
                    path: "$cancelLeave_ApplyTo",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "leaveTypes",
                    "localField": "leave_type",
                    "foreignField": "_id",
                    "as": "leaveTypes"
                }
            },
            {
                "$unwind": {
                    path: "$leaveTypes",
                    "preserveNullAndEmptyArrays": true
                }
            },
            { "$match": { "isDeleted": false, "emp_id": parseInt(req.query.emp_id) } },
            {
                "$project": {
                    "_id": "$_id",
                    "emp_id": "$emp_id",
                    "emp_name": "$emp_name.fullName",
                    "leave_type": "$leave_type",
                    "leave_type_name": "$leaveTypes.type",
                    "forwardTo": "$forwardTo",
                    "forwardTo_FullName": "$forwardTo_name.fullName",
                    "remark": "$remark",
                    "cancelLeaveApplyTo": "$cancelLeaveApplyTo",
                    "cancelLeaveApplyTo_name": "$cancelLeave_ApplyTo.fullName",
                    "cancelReason": "$cancelReason",
                    "isCancelled": "$isCancelled",
                    "isApproved": "$isApproved",
                    "ccTo": "$ccTo",
                    "contactDetails": "$contactDetails",
                    "applyTo": "$applyTo",
                    "applyTo_name": "$sup_name.fullName",
                    "toDate": "$toDate",
                    "fromDate": "$fromDate"

                }
            }

        ]).exec(function (err, results) {
            if (err) {
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
            return res.status(200).json({ "data": results });
        });
    },
    getCancelEmployeeLeaveDetails: (req, res) => {
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
                "$unwind": {
                    path: "$emp_name",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "employeedetails",
                    "localField": "forwardTo",
                    "foreignField": "_id",
                    "as": "forwardTo_name"
                }
            },
            {
                "$unwind": {
                    path: "$forwardTo_name",
                    "preserveNullAndEmptyArrays": true
                }
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
                "$unwind": {
                    path: "$sup_name",
                    "preserveNullAndEmptyArrays": true
                }
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
                "$unwind": {
                    path: "$cancelLeave_ApplyTo",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": "leaveTypes",
                    "localField": "leave_type",
                    "foreignField": "_id",
                    "as": "leaveTypes"
                }
            },
            {
                "$unwind": {
                    path: "$leaveTypes",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$match": {
                    $and: [
                        { "isDeleted": false },
                        { "emp_id": parseInt(req.query.emp_id) },
                        {
                            //skip records where isCancelled is true
                            $or: [{ "isCancelled": null },
                            { "isCancelled": false }],

                        },
                        {
                            //skip records where isRejected is true
                            $or: [{ "isRejected": null },
                            { "isRejected": false }]
                        }
                    ]
                }
            },
            // { "$match": { "isDeleted": false, "emp_id": parseInt(req.query.emp_id), "isCancelled" : null , "isCancelled" : false } },
            {
                "$project": {
                    "_id": "$_id",
                    "emp_id": "$emp_id",
                    "emp_name": "$emp_name.fullName",
                    "leave_type": "$leave_type",
                    "leave_type_name": "$leaveTypes.type",
                    "forwardTo": "$forwardTo",
                    "forwardTo_FullName": "$forwardTo_name.fullName",
                    "remark": "$remark",
                    "cancelLeaveApplyTo": "$cancelLeaveApplyTo",
                    "cancelLeaveApplyTo_name": "$cancelLeave_ApplyTo.fullName",
                    "cancelReason": "$cancelReason",
                    "isCancelled": "$isCancelled",
                    "isApproved": "$isApproved",
                    "isForwarded": "$isForwarded",
                    "status": '',
                    "ccTo": "$ccTo",
                    "contactDetails": "$contactDetails",
                    "applyTo": "$applyTo",
                    "applyTo_name": "$sup_name.fullName",
                    "toDate": "$toDate",
                    "fromDate": "$fromDate"

                }
            }

        ]).exec(function (err, results) {
            if (err) {
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
            results.forEach((x) => {
                if ((x.isForwarded === null || x.isForwarded === undefined) && (x.isCancelled === null || x.isCancelled === undefined) && (x.isApproved === null || x.isApproved === undefined)) {
                    x.status = "pending"
                }
                else if (x.isForwarded === true && (x.isCancelled === null || x.isCancelled === undefined) && (x.isApproved === null || x.isApproved === undefined)) {
                    x.status = "forwarded"
                }
                else if ((x.isForwarded === null || x.isForwarded === undefined) && (x.isCancelled === null || x.isCancelled === undefined) && x.isApproved === true) {
                    x.status = "approved"
                }
            })
            return res.status(200).json({ "data": results });
        });
    },
    getAllEmployeeEmails: (req, res) => {
        getAllEmployeeEmails(req, res);
    },
    postCancelLeave: (req, res) => {
        async.waterfall([
            function (done) {
                cancelLeave(req, res, done);
            }, function (_cancelLeaveDetails, done) {
                return res.status(200).json(_cancelLeaveDetails);
            }
        ])
    }
}

module.exports = functions;