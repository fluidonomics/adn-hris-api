let express = require('express'),
    EmployeeInfo = require('../models/employee/employeeDetails.model'),
    PersonalInfo = require('../models/employee/employeePersonalDetails.model'),
    OfficeInfo = require('../models/employee/employeeOfficeDetails.model'),
    SupervisorInfo = require('../models/employee/employeeSupervisorDetails.model'),
    EmployeeRoles = require('../models/employee/employeeRoleDetails.model'),
    BatchInfo = require('../models/workflow/batch.model'),
    KraWorkFlowInfo = require('../models/kra/kraWorkFlowDetails.model'),
    AuditTrail = require('../class/auditTrail');
    async = require('async');
    require('dotenv').load()


function addBatchInfoDetails(req, res, done) {
    let batchDetails = new BatchInfo(req.body);
    batchDetails.createdBy = parseInt(req.headers.uid);

    batchDetails.save(function (err, batchInfoData) {
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
        AuditTrail.auditTrailEntry(0, "batchDetails", batchDetails, "batch", "addBatchInfoDetails", "ADDED");
        return done(err, batchInfoData);
    });
}

function updateBatchInfoDetails(req, res, done) {
    let batchDetails = new BatchInfo(req.body);
    batchDetails.updatedBy = parseInt(req.headers.uid);
    BatchInfo.findOneAndUpdate({
        _id: parseInt(req.body._id)
    }, batchDetails, {
        new: true
    }, function (err, batchInfoData) {
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
        AuditTrail.auditTrailEntry(0, "batchDetails", batchDetails, "batch", "updateBatchInfoDetails", "UPDATED");
        return done(err, batchInfoData);
    });
}

function getBatchInfoDetails(req, res, done) {
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
    BatchInfo.find(query, function (err, batchInfoData) {
        if (err) {
            return res.status(403).json({
                title: 'There was an error, please try again later',
                error: err
            });
        }
        return done(err, batchInfoData);

    });
}

function updateKraWorkFlowInfoDetails(req, res, done) {
    let batch_id = req.query.batch_id;
    let query = {
        _id: parseInt(req.body._id),
        isDeleted: false
    }
    if (batch_id) {
        query = {
            batch_id: parseInt(req.query.batch_id),
            isDeleted: false
        }
    }

    let queryUpdate = {
        $set: {
            "status": req.body.status,
            "updatedBy": parseInt(req.headers.uid)
        }
    };


    KraWorkFlowInfo.update(query, queryUpdate, {
        new: true
    }, function (err, kraWorkFlowInfoData) {
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
        AuditTrail.auditTrailEntry(kraWorkFlowInfoData.emp_id, "kraWorkFlowDetails", kraWorkFlowInfoData, "batch", "updateKraWorkFlowInfoDetails", "UPDATED");
        return done(err, kraWorkFlowInfoData);
    });
}

function getBatchNamesByEmp(req, res, done) {
    BatchInfo.aggregate([{
            "$lookup": {
                "from": "kraworkflowdetails",
                "localField": "_id",
                "foreignField": "batch_id",
                "as": "kraworkflowdetails"
            }
        },
        {
            "$unwind": {
                "path": "$kraworkflowinfo",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            "$match": {
                "kraworkflowdetails.emp_id": parseInt(req.query.emp_id)
            }
        },
    ]).exec(function (err, batchInfoData) {
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
        return done(err, batchInfoData);
    });
}

let functions = {
    getBatchInfo: (req, res) => {
        async.waterfall([
            function (done) {
                getBatchInfoDetails(req, res, done);
            },
            function (batchDetailsData, done) {
                return res.status(200).json({
                    "data": batchDetailsData
                });
            }
        ]);
    },

    addBatchInfo: (req, res) => {
        async.waterfall([
            function (done) {
                addBatchInfoDetails(req, res, done);
            },
            function (batchInfoData, done) {
                return res.status(200).json(batchInfoData);
            }
        ]);
    },

    updateBatchInfo: (req, res) => {
        async.waterfall([
            function (done) {
                if (req.body.status == 'Terminated' && req.body.batchType) {
                    async.waterfall([
                        function (done) {
                            if (req.body.batchType == "KRA") {
                                req.query.batch_id = req.body._id;
                                updateKraWorkFlowInfoDetails(req, res, done);
                            } else
                                done(null, null)
                        },
                        function (batchInfoData, done) {
                            updateBatchInfoDetails(req, res, done);
                        },
                        function (batchInfoData, done) {
                            return res.status(200).json(batchInfoData);
                        },
                    ]);
                } else {
                    updateBatchInfoDetails(req, res, done);
                }
            },
            function (batchInfoData, done) {
                return res.status(200).json(batchInfoData);
            }
        ]);
    },

    getBatchInfoByEmp: (req, res) => {
        async.waterfall([
            function (done) {
                getBatchNamesByEmp(req, res, done);
            },
            function (batchDetailsData, done) {
                return res.status(200).json({
                    "data": batchDetailsData
                });
            }
        ]);
    }
}
module.exports = {
    functions,
    addBatchInfoDetails
};