let async = require('async'),
    MidTermBatch = require("../models/midterm/midtermbatch"),
    MidTermMaster = require('../models/midterm/midtermmaster'),
    MidTermDetail = require('../models/midterm/midtermdetails'),
    AuditTrail = require('../class/auditTrail'),
    PapBatchDetails = require('../models/pap/papBatch.model'),
    PapMasterDetails = require('../models/pap/papMaster.model'),
    EmployeeSupervisorDetails = require('../models/employee/employeeSupervisorDetails.model'),
    EmployeeDetails = require('../models/employee/employeeDetails.model'),
    SendEmail = require('../class/sendEmail'),
    PapDetails = require('../models/pap/papDetails.model'),
    KraMaster = require('../models/kra/kraWorkFlowDetails.model'),
    KraDetail = require('../models/kra/kraDetails.model'),
    moment = require('moment');

require('dotenv').load();


function fixFiscalYearIdOfCollections(req, res) {
    async.waterfall([
        (done) => {
            KraMaster.aggregate([
                {
                    $lookup: {
                        'from': 'kradetails',
                        'localField': '_id',
                        'foreignField': 'kraWorkflow_id',
                        'as': 'kraDetails'
                    }
                },
                {
                    $unwind: {
                        'path': '$kraDetails',
                        'preserveNullAndEmptyArrays': true
                    }
                }
            ]).exec((err, result) => {
                done(err, result);
            })
        },
        (kras, innerDone) => {
            kras.forEach(kra => {
                MidTermDetail.aggregate([
                    {
                        $match: {

                        }
                    },
                    {
                        $lookup: {
                            'from': 'kradetails',
                            'localField': '_id',
                            'foreignField': 'kraWorkflow_id',
                            'as': 'kraDetails'
                        }
                    },
                    {
                        $unwind: {
                            'path': '$kraDetails',
                            'preserveNullAndEmptyArrays': true
                        }
                    }
                ]).exec((err, result) => {

                });
            });
        }

    ], (error, result) => {
        if (err) {
            return res.status(403).json({
                title: 'There is a problem',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });
        } else {
            return res.status(200).json({
                title: 'Success',
                result: {
                    message: result
                }
            });
        }
    });
}

function fixKraWorkflowIdForMTRCollections(req, res) {
    async.waterfall([
        (done) => {
            MidTermDetail.aggregate([
                {
                    $match: {
                        kraWorkflow_id: null
                    }
                },
                {
                    $lookup: {
                        'from': 'midtermmasters',
                        'localField': 'mtr_master_id',
                        'foreignField': '_id',
                        'as': 'midtermmasters'
                    }
                },
                {
                    $unwind: {
                        'path': '$midtermmasters',
                        'preserveNullAndEmptyArrays': true
                    }
                }
            ]).exec((err, result) => {
                done(err, result);
            })
        },
        (mtrData, done) => {
            mtrData.forEach(mtr => {
                if (mtr.midtermmasters) {
                    KraMaster.find({ emp_id: mtr.midtermmasters.emp_id, status: { $neq: 'Terminated' } })
                        .sort(
                            {
                                "_id": 1.0
                            }
                        ).exec((err, result) => {
                            if (result.length <= 2) {
                                done(err, mtr, result);
                            } else {
                                console.log("Employee has more than 2 kra's | ", mtr.midtermmasters.emp_id);
                            }
                        });
                }
            });
        },
        (mtrData, kraData, done) => {
            let updateCondition = {
                mtr_master_id: mtrData.mtr_master_id
            };
            let updateData = {
                kraWorkflow_id: kraData[0]._id
            }
            MidTermDetail.updateMany(updateCondition, updateData).exec((err, result) => {
                // done(err, result);
            })
        }
    ], (err, result) => {
        if (err) {
            return res.status(403).json({
                title: 'There is a problem',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });
        } else {
            return res.status(200).json({
                title: 'Success',
                result: {
                    message: result
                }
            });
        }
    });
}

let functions = {
    fixFiscalYearIdOfCollections: (req, res) => {
        fixFiscalYearIdOfCollections(req, res);
    },
    fixKraWorkflowIdForMTRCollections: (req, res) => {
        fixKraWorkflowIdForMTRCollections(req, res);
    }
}


function sendResponse(res, err, response, title) {
    if (err) {
        return res.status(403).json({
            title: 'There is a problem while fetching data',
            error: {
                message: err
            },
            result: {
                message: response
            }
        });
    } else {
        return res.status(200).json({
            title: title,
            result: {
                message: response
            }
        });
    }
}

module.exports = functions;




// function functionName(req, res) {
//     async.waterfall([
//     ], (error, result) => {
//         if (err) {
//             return res.status(403).json({
//                 title: 'There is a problem',
//                 error: {
//                     message: err
//                 },
//                 result: {
//                     message: result
//                 }
//             });
//         } else {
//             return res.status(200).json({
//                 title: 'Success',
//                 result: {
//                     message: result
//                 }
//             });
//         }
//     });
// }