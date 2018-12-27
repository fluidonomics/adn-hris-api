let express = require('express'),
    KraInfo = require('../models/kra/kraDetails.model'),
    KraWorkFlowInfo = require('../models/kra/kraWorkFlowDetails.model'),
    KraWeightageInfo = require('../models/kra/kraWeightage.model'),
    KraCategoryInfo = require('../models/kra/kraCategory.model'),
    EmployeeInfo = require('../models/employee/employeeDetails.model'),
    EmployeeSupervisors = require('../models/employee/employeeSupervisorDetails.model'),
    BatchInfo = require('../models/workflow/batch.model'),
    Department = require('../models/master/department.model'),
    LeaveTypes = require('../models/leave/leaveTypes.model'),
    LeaveApply = require('../models/leave/leaveApply.model'),
    async = require('async'),
    csvWriter = require('csv-write-stream'),
    Json2csvParser = require('json2csv').Parser,
    path = require('path'),
    mime = require('mime'),
    fs = require('fs'),
    BatchCtrl = require('./batch.controller'),
    TimeLineCtrl = require('./timeline.controller'),
    AuditTrail = require('../class/auditTrail');

require('dotenv').load();

function getKraReport(req, res, done) {
    async.waterfall([
        (innerDone) => {
            EmployeeInfo.aggregate([
                {
                    $lookup: {
                        "from": "kraworkflowdetails",
                        "localField": "_id",
                        "foreignField": "emp_id",
                        "as": "kraworkflowdetails"
                    }
                },
                {
                    $unwind: {
                        path: "$kraworkflowdetails",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        "from": "kradetails",
                        "localField": "kraworkflowdetails._id",
                        "foreignField": "kraWorkflow_id",
                        "as": "kradetails"
                    }
                },
                {
                    $unwind: {
                        path: "$kradetails",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $group: {
                        "_id": "$_id",
                        "company_id": { $first: "$company_id" },
                        "createdAt": { $first: "$createdAt" },
                        "createdBy": { $first: "$createdBy" },
                        "designation_id": { $first: "$designation_id" },
                        "employmentType_id": { $first: "$employmentType_id" },
                        "fullName": { $first: "$fullName" },
                        "grade_id": { $first: "$grade_id" },
                        "isAccountActive": { $first: "$isAccountActive" },
                        "isDeleted": { $first: "$isDeleted" },
                        "password": { $first: "$password" },
                        "profileImage": { $first: "$profileImage" },
                        "resetPasswordExpires": { $first: "$resetPasswordExpires" },
                        "resetPasswordToken": { $first: "$resetPasswordToken" },
                        "updatedAt": { $first: "$updatedAt" },
                        "updatedBy": { $first: "$updatedBy" },
                        "userName": { $first: "$userName" },
                        "kraworkflowdetails": { $first: "$kraworkflowdetails" },
                        "kradetails": { $push: "$kradetails" }
                    }
                }
            ]).exec(innerDone);
        }
    ], (err, result) => {
        console.log(result.length);
        result.forEach(emp => {
            if (emp.kraworkflowdetails == null || emp.kraworkflowdetails == undefined) {
                emp.kraStatus = "Not Initiated";
            } else {
                if (emp.kradetails && emp.kradetails.length > 0) {
                    let pendingCount = emp.kradetails.filter(kra => kra.supervisorStatus != "Approved");
                    emp.kraCount = emp.kradetails.length;
                    if (pendingCount > 0) {
                        emp.kraStatus = "Pending";
                    } else {
                        emp.kraStatus = "Approved";
                    }
                } else {
                    emp.kraCount = 0;
                    emp.kraStatus = "Pending";
                }
            }
        });
        let csvData = result.map(emp => {
            return {
                "userName": emp.userName,
                "fullName": emp.fullName,
                "kraCount": emp.kraCount,
                "kraStatus": emp.kraStatus
            }
        })
        const fields = [
            "userName",
            "fullName",
            "kraCount",
            "kraStatus"
        ];
        const json2csvParser = new Json2csvParser({ fields });
        const csv = json2csvParser.parse(csvData);
        // console.log('test new demo',csv);

        fs.writeFile('KRA_Report.csv', csv, function (err) { //currently saves file to app's root directory
            if (err) throw err;
            // console.log('file saved');

            var file = 'KRA_Report.csv';
            res.download(file, 'KRA_Report.csv');

        });
        // done(err, result);
    })
}

function getProfileApprovalReport(req, res, done) {
    async.waterfall([
        (innerDone) => {
            EmployeeInfo.aggregate([
                {
                    $lookup: {
                        "from": "employeeprofileprocessdetails",
                        "localField": "_id",
                        "foreignField": "emp_id",
                        "as": "employeeprofileprocessdetails"
                    }
                },
                {
                    $unwind: {
                        path: "$employeeprofileprocessdetails",
                        preserveNullAndEmptyArrays: true
                    }
                }
            ]).exec(innerDone);
        }
    ], (err, result) => {
        console.log(result.length);

        let csvData = result.map(emp => {
            return {
                "userName": emp.userName,
                "fullName": emp.fullName,
                "employeeStatus": emp.employeeprofileprocessdetails.employeeStatus,
                "hrStatus": emp.employeeprofileprocessdetails.hrStatus,
                "supervisorStatus": emp.employeeprofileprocessdetails.supervisorStatus
            }
        })
        const fields = [
            "userName",
            "fullName",
            "employeeStatus",
            "hrStatus",
            "supervisorStatus"
        ];
        const json2csvParser = new Json2csvParser({ fields });
        const csv = json2csvParser.parse(csvData);
        // console.log('test new demo',csv);

        fs.writeFile('Profile_Approval_Report.csv', csv, function (err) { //currently saves file to app's root directory
            if (err) throw err;
            // console.log('file saved');

            var file = 'Profile_Approval_Report.csv';
            res.download(file, 'Profile_Approval_Report.csv');

        });
        // done(err, result);
    })
}

let functions = {
    getKraReport: (req, res) => {
        async.waterfall([
            function (done) {
                getKraReport(req, res, done);
            },
            function (kraInfoData, done) {
                return res.status(200).json(kraInfoData);
            }
        ]);
    },
    getProfileApprovalReport: (req, res) => {
        async.waterfall([
            function (done) {
                getProfileApprovalReport(req, res, done);
            },
            function (kraInfoData, done) {
                return res.status(200).json(kraInfoData);
            }
        ]);
    }
}

module.exports = functions;