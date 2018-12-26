let async = require('async'),
    MidTermMaster = require('../models/midterm/midtermmaster'),
    MidTermDetail = require('../models/midterm/midtermdetails'),
    AuditTrail = require('../class/auditTrail'),
    PapBatchDetails = require('../models/pap/papBatch.model'),
    PapMasterDetails = require('../models/pap/papMaster.model'),
    PapDetails = require('../models/pap/papDetails.model');

require('dotenv').load();

function getEmployeesForPapInitiate(req, res) {
    MidTermMaster.aggregate([
        {
            $match: {
                status: 'Approved',
                isDeleted: false
            }
        },
        {
            $lookup: {
                from: 'employeedetails',
                localField: 'emp_id',
                foreignField: '_id',
                as: 'employee_details'
            }
        },
        {
            $unwind: {
                path: '$employee_details'
            }
        },
        {
            $lookup: {
                from: 'employeesupervisordetails',
                localField: 'emp_id',
                foreignField: 'emp_id',
                as: 'employee_superviosr_details'
            }
        },
        {
            $unwind: {
                path: '$employee_superviosr_details'
            }
        },
        {
            $lookup: {
                from: 'employeeofficedetails',
                localField: 'emp_id',
                foreignField: 'emp_id',
                as: 'employee_office_details'
            }
        },
        {
            $unwind: {
                path: '$employee_office_details'
            }
        },
        {
            $lookup: {
                from: 'designations',
                localField: 'employee_details.designation_id',
                foreignField: '_id',
                as: 'designations'
            }
        },
        {
            $unwind: {
                path: '$designations'
            }
        },
        {
            $lookup: {
                from: 'employeedetails',
                localField: 'employee_superviosr_details.primarySupervisorEmp_id',
                foreignField: '_id',
                as: 'supervisor_details'
            }
        },
        {
            $unwind: {
                path: '$supervisor_details'
            }
        },
        {
            $lookup: {
                'from': 'papmasters',
                'localField': 'emp_id',
                'foreignField': 'emp_id',
                'as': 'pap_master'
            }
        },
        {
            $unwind: {
                'path': '$pap_master',
                'preserveNullAndEmptyArrays': true
            }
        },
        {
            $project: {
                mtr_master_id: '$_id',
                emp_id: '$emp_id',
                userName: '$employee_details.userName',
                fullName: '$employee_details.fullName',
                grade_id: '$employee_details.grade_id',
                profileImage: '$employee_details.profileImage',
                designation_id: '$employee_details.designation_id',
                designationName: '$designations.designationName',
                department_id: '$employee_office_details.department_id',
                supervisor_id: '$employee_superviosr_details.primarySupervisorEmp_id',
                supervisorName: '$supervisor_details.fullName',
                emp_emailId: '$employee_office_details.officeEmail',
                pap_master_id: '$pap_master._id'
            }
        }
    ]).exec(function (err, response) {
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
                title: 'Data fetched successfully',
                result: {
                    message: response
                }
            });
        }
    });
}
function initiatePapProcess(req, res) {
    let createdBy = parseInt(req.body.createdBy);
    let emp_id_array = req.body.emp_id_array;
    let papBatchDetails = new PapBatchDetails();
    papBatchDetails.batchEndDate = new Date(
        new Date(req.body.batchEndDate).getTime()
    );
    papBatchDetails.createdBy = createdBy;
    papBatchDetails.batchName = req.body.batchName;
    async.waterfall([
        done => {
            papBatchDetails.save(function (err, response) {
                AuditTrail.auditTrailEntry(
                    0,
                    "papBatchDetails",
                    papBatchDetails,
                    "PAP",
                    "initiatePapProcess",
                    "ADDED"
                );
                done(err, response._doc);
            });
        },
        (papMasterCount, done) => {
            PapMasterDetails.aggregate([
                {
                    $sort: {
                        _id: -1.0
                    }
                },
                {
                    $project: {
                        _id: '$_id'
                    }
                },
                {
                    $limit: 1.0
                }
            ]).exec(function (err, data) {
                papMasterCount.pap_master_max_id =
                    data.length === 0 ? 0 : data[0]._id;
                done(err, papMasterCount);
            });
        },
        (papMasterCount, done) => {
            let dataToInsert = [];
            emp_id_array.forEach(function (element, index) {
                dataToInsert.push({
                    _id: papMasterCount.pap_master_max_id + (index + 1),
                    createdBy: createdBy,
                    emp_id: parseInt(element.emp_id),
                    batch_id: papMasterCount._id,
                    mtr_master_id: parseInt(element.mtr_master_id)
                });
            });
            PapMasterDetails.insertMany(dataToInsert, function (err, response) {
                AuditTrail.auditTrailEntry(
                    0,
                    "papMaster",
                    dataToInsert,
                    "PAP",
                    "initiatePapProcess",
                    "ADDED"
                );
                done(err, response);
            });
        },
        (papMasterReponse, done) => {
            let query = [];
            papMasterReponse.forEach(function (element) {
                query.push(element.mtr_master_id);
            });
            MidTermDetail.aggregate([{
                '$match': {
                    'progressStatus': {
                        '$ne': 'Dropped'
                    },
                    'mtr_master_id': {
                        '$in': query
                    }
                }
            },
                // {
                //     '$project': {
                //         'mtr_detail_id': '$_id',
                //         'mtr_master_id': '$mtr_master_id'
                //     }
                // }
            ]).exec(function (err, data) {
                papMasterReponse.forEach(f => {
                    data.filter(fi => fi.mtr_master_id === f.mtr_master_id)
                        .map(m => {
                            m.pap_master_id = f._id
                            m.emp_id = f.emp_id
                        });
                })
                done(err, data);
            })
        },
        (papMasterData, done) => {
            PapDetails.aggregate([
                {
                    $sort: {
                        _id: -1.0
                    }
                },
                {
                    $project: {
                        _id: '$_id'
                    }
                },
                {
                    $limit: 1.0
                }
            ]).exec(function (err, data) {
                papMasterData.pap_details_max_id =
                    data.length === 0 ? 0 : data[0]._id;
                done(err, papMasterData);
            });
        },
        (papMasterData, done) => {
            let papDetailsToInsert = [];
            papMasterData.forEach((data, index) => {
                let papDetails = new PapDetails();
                papDetails._id = papMasterData.pap_details_max_id + (index + 1);
                papDetails.pap_master_id = data.pap_master_id;
                papDetails.empId = data.emp_id;
                papDetails.mtr_details_id = data._id;
                papDetails.status = "Initiated";
                papDetails.updatedBy = createdBy;
                papDetails.createdBy = createdBy;
                papDetails.createdAt = new Date();
                papDetailsToInsert.push(papDetails);
            });
            PapDetails.insertMany(papDetailsToInsert, function (err, papDetailsResponse) {
                AuditTrail.auditTrailEntry(
                    0,
                    "papDetails",
                    papDetailsToInsert,
                    "PAP",
                    "initiatePapProcess",
                    "ADDED"
                );
                done(err, papDetailsResponse);
            });
        }
    ], (err, result) => {
        if (err) {
            return res.status(403).json({
                title: 'There is a problem while initiating batch',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });
        } else {
            return res.status(200).json({
                title: 'Batch initiated successfully',
                result: {
                    message: result
                }
            });
        }
    });
}

function getPapBatches(req, res) {
    let currentUserId = parseInt(req.query.currentUserId);
    PapBatchDetails.aggregate([
        {
            $match: {
                createdBy: currentUserId
            }
        },
        {
            $lookup: {
                from: "papmasters",
                localField: "_id",
                foreignField: "batch_id",
                as: "pap_master"
            }
        },
        {
            $unwind: {
                path: "$pap_master"
            }
        },
        {
            $lookup: {
                from: "employeedetails",
                localField: "pap_master.emp_id",
                foreignField: "_id",
                as: "emp_details"
            }
        },
        {
            $unwind: {
                path: "$emp_details",
            }
        },
        {
            $project: {
                _id: 1,
                updatedAt: 1,
                createdAt: 1,
                createdBy: 1,
                isDeleted: 1,
                updatedBy: 1,
                status: 1,
                batchEndDate: 1,
                batchName: 1,
                pap_master: {
                    _id: 1,
                    updatedAt: 1,
                    createdAt: 1,
                    createdBy: 1,
                    emp_id: 1,
                    batch_id: 1,
                    mtr_master_id: 1,
                    isDeleted: 1,
                    updatedBy: 1,
                    isRatingCommunicated: 1,
                    status: 1,
                    emp_details: "$emp_details"
                }
            }
        },
        {
            $group: {
                _id: "$_id",
                updatedAt: { $first: "$updatedAt" },
                createdAt: { $first: "$createdAt" },
                createdBy: { $first: "$createdBy" },
                isDeleted: { $first: "$isDeleted" },
                updatedBy: { $first: "$updatedBy" },
                status: { $first: "$status" },
                batchEndDate: { $first: "$batchEndDate" },
                batchName: { $first: "$batchName" },
                pap_master: { $push: "$pap_master" }
            }
        }
    ]).exec((err, response) => {
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
                title: 'Data fetched successfully',
                result: {
                    message: response
                }
            });
        }
    });
}

function getPapDetailsSingleEmployee(req, res) {
    let empId = parseInt(req.query.emp_id);
    PapDetails.aggregate([
        {
            '$lookup': {
                'from': 'midtermdetails',
                'localField': 'mtr_details_id',
                'foreignField': '_id',
                'as': 'mtr_details'
            }
        },
        {
            '$unwind': {
                'path': '$mtr_details'
            }
        },
        {
            '$project': {
                'pap_master_id': '$pap_master_id',
                'empId': '$empId',
                'mtr_details_id': '$mtr_details_id',
                'createdBy': '$createdBy',
                'createdAt': '$createdAt',
                'isDeleted': '$isDeleted',
                'updatedBy': '$updatedBy',
                'grievanceRemark': '$grievanceRemark',
                'grievance_ratingScaleId': '$grievance_ratingScaleId',
                'status': '$mtr_details.status',
                'reviewerRemark': '$reviewerRemark',
                'supRemark': '$supRemark',
                'sup_ratingScaleId': '$sup_ratingScaleId',
                'empRemark': '$empRemark',
                'emp_ratingScaleId': '$emp_ratingScaleId',
                'kraWorkflow_id': '$mtr_details.kraWorkflow_id',
                'supervisor_id': '$mtr_details.supervisor_id',
                'colorStatus': '$mtr_details.colorStatus',
                'progressStatus': '$mtr_details.progressStatus',
                'supervisorComment': '$mtr_details.supervisorComment',
                'employeeComment': '$mtr_details.employeeComment',
                'measureOfSuccess': '$mtr_details.measureOfSuccess',
                'unitOfSuccess': '$mtr_details.unitOfSuccess',
                'category_id': '$mtr_details.category_id',
                'weightage_id': '$mtr_details.weightage_id',
                'mtr_kra': '$mtr_details.mtr_kra'
            }
        },
        {
            "$match": {
                "empId": empId
            }
        }
    ]).exec(function (err, response) {
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
                title: 'Data fetched successfully',
                result: {
                    message: response
                }
            });
        }
    })
}


function getPapBySupervisor(req, res) {

}


function papUpdate(req, res) {
    async.waterfall([
        (done) => {
            let updateQuery = {
                "updatedAt": new Date(),
                "updatedBy": parseInt(req.body.updatedBy),
                "status": "Pending",
                "empRemark": req.body.empRemark,
                "emp_ratingScaleId": req.body.emp_ratingScaleId
            }
            PapDetails.findOneAndUpdate({ _id: req.body.papDetailsId }, updateQuery, (err, res) => {
                done(err, res);
            })
        },
        (papDetails, done) => {
            AuditTrail.auditTrailEntry(
                0,
                "papDetails",
                papDetails,
                "PAP",
                "papUpdate",
                "UPDATED"
            );
            done(null, papDetails);
        }
    ], (err, result) => {
        sendResponse(res, err, result, 'Pap details updated successfully');
    })
}

function papSubmit(req, res) {
    async.waterfall([
        (done) => {
            let updateQuery = {
                "updatedAt": new Date(),
                "updatedBy": parseInt(req.body.updatedBy),
                "status": "Submitted"
            };
            PapDetails.updateMany({ pap_master_id: req.body.pap_master_id }, updateQuery, (err, papDetails) => {
                done(err, papDetails);
            });
        },
        (papDetails, done) => {
            AuditTrail.auditTrailEntry(
                0,
                "papDetails",
                papDetails,
                "PAP",
                "papSubmit",
                "UPDATED"
            );
            done(null, papDetails);
        }
    ], (err, results) => {
        sendResponse(res, err, results, 'Pap details updated successfully');
    });
}

function updateBatch(req, res) {
    async.waterfall([
        (done) => {
            let updateQuery = {
                "updatedAt": new Date(),
                "updatedBy": parseInt(req.body.updatedBy),
                "batchEndDate": req.body.batchEndDate
            }
            PapBatchDetails.update({ _id: parseInt(req.body.batchId) }, updateQuery, (err, papBatchDetails) => {
                done(err, papBatchDetails);
            })
        },
        (papBatchDetails, done) => {
            AuditTrail.auditTrailEntry(
                0,
                "papBatchDetails",
                papBatchDetails,
                "PAP",
                "updateBatch",
                "UPDATED"
            );
            done(null, papBatchDetails);
        }
    ], (err, results) => {
        sendResponse(res, err, results, 'Pap Batch updated successfully');
    })
}

function papUpdateSupervisor(req, res) {
    async.waterfall([
        (done) => {
            let updateQuery = {
                "updatedAt": new Date(),
                "updatedBy": parseInt(req.body.updatedBy),
                "status": "Pending Reviewer",
                "supRemark": req.body.supRemark,
                "sup_ratingScaleId": req.body.sup_ratingScaleId
            }
            PapDetails.findOneAndUpdate({ _id: req.body.papDetailsId }, updateQuery, (err, res) => {
                done(err, res);
            })
        },
        (papDetails, done) => {
            AuditTrail.auditTrailEntry(
                0,
                "papDetails",
                papDetails,
                "PAP",
                "papUpdateSupervisor",
                "UPDATED"
            );
            done(null, papDetails);
        }
    ], (err, result) => {
        sendResponse(res, err, result, 'Pap details updated successfully');
    })
}


let functions = {
    getEmployeesForPapInitiate: (req, res) => {
        getEmployeesForPapInitiate(req, res);
    },
    initiatePapProcess: (req, res) => {
        initiatePapProcess(req, res);
    },
    getPapBatches: (req, res) => {
        getPapBatches(req, res);
    },
    getPapDetailsSingleEmployee: (req, res) => {
        getPapDetailsSingleEmployee(req, res);
    },
    getPapBySupervisor: (req, res) => {
        getPapBySupervisor(req, res);
    },
    papUpdate: (req, res) => {
        papUpdate(req, res);
    },
    papSubmit: (req, res) => {
        papSubmit(req, res);
    },
    updateBatch: (req, res) => {
        updateBatch(req, res);
    },
    papUpdateSupervisor: (req, res) => {
        papUpdateSupervisor(req, res);
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