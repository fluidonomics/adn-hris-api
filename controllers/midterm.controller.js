let KraWorkFlowInfo = require("../models/kra/kraWorkFlowDetails.model"),
  MidTermBatch = require("../models/midterm/midtermbatch"),
  MidTermMaster = require("../models/midterm/midtermmaster"),
  MidTermDetails = require("../models/midterm/midtermdetails"),
  AuditTrail = require("../class/auditTrail"),
  EmployeeSupervisorDetails = require("../models/employee/employeeSupervisorDetails.model");

function EmpDetailsForMidTermInitiate(req, res) {
  KraWorkFlowInfo.aggregate([
    {
      $project: {
        emp_id: "$emp_id",
        batch_id: "$batch_id",
        status: "$status"
      }
    },
    {
      $match: {
        "status": "Approved"
      }
    },
    {
      $lookup: {
        from: "employeedetails",
        localField: "emp_id",
        foreignField: "_id",
        as: "employee_details"
      }
    },
    {
      $unwind: {
        path: "$employee_details"
      }
    },
    {
      $lookup: {
        from: "employeeofficedetails",
        localField: "emp_id",
        foreignField: "emp_id",
        as: "employee_office_details"
      }
    },
    {
      $unwind: {
        path: "$employee_office_details"
      }
    },
    {
      $lookup: {
        from: "midtermmasters",
        localField: "emp_id",
        foreignField: "emp_id",
        as: "mtr_master_details"
      }
    },
    {
      $unwind: {
        path: "$mtr_master_details",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "designations",
        localField: "employee_details.designation_id",
        foreignField: "_id",
        as: "designation_details"
      }
    },
    {
      $unwind: {
        path: "$designation_details"
      }
    },
    {
      $lookup: {
        from: "employeesupervisordetails",
        localField: "emp_id",
        foreignField: "emp_id",
        as: "employee_supervisor_details"
      }
    },
    {
      $unwind: {
        path: "$employee_supervisor_details"
      }
    },
    {
      $lookup: {
        from: "employeedetails",
        localField: "employee_supervisor_details.primarySupervisorEmp_id",
        foreignField: "_id",
        as: "supervisor_details"
      }
    },
    {
      $unwind: {
        path: "$supervisor_details"
      }
    },
    {
      $project: {
        emp_id: "$emp_id",
        kra_batch_id: "$batch_id",
        kra_status: "$status",
        emp_full_name: "$employee_details.fullName",
        emp_grade_id: "$employee_details.grade_id",
        emp_isAccountActive: "$employee_details.isAccountActive",
        emp_profileImage: "$employee_details.profileImage",
        emp_userName: "$employee_details.userName",
        emp_employmentType_id: "$employee_details.employmentType_id",
        emp_isDeleted: "$employee_details.isDeleted",
        emp_department_id: "$employee_office_details.department_id",
        emp_HRSpoc_id: "$employee_office_details.hrspoc_id",
        emp_officeEmail: "$employee_office_details.officeEmail",
        emp_designation_id: "$employee_details.designation_id",
        emp_designation_name: "$designation_details.designationName",
        emp_supervisor_id:
          "$employee_supervisor_details.primarySupervisorEmp_id",
        emp_supervisor_name: "$supervisor_details.fullName",
        mtr_status: "$mtr_master_details.status",
        mtr_batch_id: "$mtr_master_details.batch_id"
      }
    }
  ]).exec(function (err, response) {
    if (err) {
      return res.status(403).json({
        title: "There is a problem",
        error: {
          message: err
        },
        result: {
          message: err
        }
      });
    } else {
      return res.status(200).json({ result: response });
    }
  });
}
function InitiateMtrProcess(req, res) {
  let createdBy = parseInt(req.body.createdBy);
  let MidTermBatchDetails = new MidTermBatch();
  MidTermBatchDetails.batchName = req.body.batchName;
  MidTermBatchDetails.batchEndDate = new Date(
    new Date(req.body.batchEndDate).getTime()
  );
  MidTermBatchDetails.status = req.body.status;
  MidTermBatchDetails.isDeleted = false;
  MidTermBatchDetails.createdBy = createdBy;
  let emp_id_array = req.body.emp_id_array;
  MidTermBatchDetails.transac;
  MidTermBatchDetails.save(function (err, midtermbatchresp) {
    if (err) {
      return res.status(403).json({
        title: "There was a problem",
        error: {
          message: err
        },
        result: {
          message: midtermbatchresp
        }
      });
    } else {
      AuditTrail.auditTrailEntry(
        0,
        "MidTermBatchDetails",
        midtermbatchresp,
        "user",
        "MidTermBatchDetails",
        "ADDED"
      );
      let batch_id = midtermbatchresp.id;
      Promise.all([
        MidTermMaster.aggregate([
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
        let midtermMaster_id =
          counts[0][0] === undefined ? 0 : counts[0][0]._id;
        emp_id_array.forEach(function (element, index) {
          insertData.push({
            batch_id: batch_id,
            emp_id: element.emp_id,
            status: "Initiated",
            _id: midtermMaster_id + (index + 1),
            createdBy: createdBy
          });
        });
        MidTermMaster.insertMany(insertData, function (
          err,
          midTermMasterResult
        ) {
          if (err) {
            return res.status(403).json({
              title: "There was a problem",
              error: {
                message: err
              },
              result: {
                message: midTermMasterResult
              }
            });
          } else {
            AuditTrail.auditTrailEntry(
              0,
              "MidTermMaster",
              insertData,
              "user",
              "MidTermMaster",
              "ADDED"
            );
            let emp_id_collection = [];
            emp_id_array.forEach(element => {
              emp_id_collection.push(element.emp_id);
            });
            Promise.all([
              //query1
              KraWorkFlowInfo.aggregate([
                {
                  $match: {
                    emp_id: {
                      $in: emp_id_collection
                    },
                    status: "Approved"
                  }
                },
                {
                  $lookup: {
                    from: "kradetails",
                    localField: "_id",
                    foreignField: "kraWorkflow_id",
                    as: "kra_details"
                  }
                },
                {
                  $unwind: {
                    path: "$kra_details",
                    preserveNullAndEmptyArrays: true
                  }
                },
                {
                  $project: {
                    kra_batch_id: "$batch_id",
                    kra_emp_id: "$emp_id",
                    kra_status: "$status",
                    kra_details_isDeleted: "$kra_details.isDeleted",
                    kra_details_sendBackComment: "$kra_details.sendBackComment",
                    kra_details_supervisorStatus:
                      "$kra_details.supervisorStatus",
                    kra_details_measureOfSuccess:
                      "$kra_details.measureOfSuccess",
                    kra_details_unitOfSuccess: "$kra_details.unitOfSuccess",
                    kra_details_weightage_id: "$kra_details.weightage_id",
                    kra_details_category_id: "$kra_details.category_id",
                    kra_details_kra: "$kra_details.kra",
                    kra_Details_id: "$kra_details._id"
                  }
                }
              ]),
              MidTermDetails.aggregate([
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
              ])
            ]).then(function (responses, err) {
              if (err) {
                return res.status(403).json({
                  title: "There was a problem",
                  error: {
                    message: err
                  },
                  result: {
                    message: midTermMasterResult
                  }
                });
              } else {
                let mtrDetailsInsertData = [];
                let kraWorklowResp = responses[0];
                let mtrDetailsMaxId =
                  responses[1][0] === undefined ? 0 : responses[1][0]._id;
                kraWorklowResp.forEach(f => {
                  f.mtr_batch_id = midTermMasterResult.find(
                    f1 => f1.emp_id === f.kra_emp_id
                  ).batch_id;
                  f.mtr_master_id = midTermMasterResult.find(
                    f1 => f1.emp_id === f.kra_emp_id
                  )._id;
                  f.emp_supervisor_id = emp_id_array.find(
                    f1 => f1.emp_id === f.kra_emp_id
                  ).supervisor_id;
                });
                console.log(kraWorklowResp);
                kraWorklowResp.forEach((f, i) => {
                  if (f.kra_details_category_id !== undefined) {
                    mtrDetailsInsertData.push({
                      _id: mtrDetailsMaxId + (i + 1),
                      kraWorkflow_id: f._id, // in aggregate it is worklow id
                      kraDetailId: f.kra_Details_id,
                      supervisor_id: f.emp_supervisor_id,
                      status: "Pending",
                      mtr_batch_id: f.mtr_batch_id,
                      mtr_master_id: f.mtr_master_id,
                      isDeleted: false,
                      mtr_kra: f.kra_details_kra,
                      weightage_id: f.kra_details_weightage_id,
                      category_id: f.kra_details_category_id,
                      unitOfSuccess: f.kra_details_unitOfSuccess,
                      measureOfSuccess: f.kra_details_measureOfSuccess
                    });
                  } else {
                  }
                });
                MidTermDetails.insertMany(mtrDetailsInsertData, function (
                  err,
                  midTermDetails
                ) {
                  if (err) {
                    return res.status(403).json({
                      title: "There was a problem",
                      error: {
                        message: err
                      },
                      result: {
                        message: midTermMasterResult
                      }
                    });
                  } else {
                    AuditTrail.auditTrailEntry(
                      0,
                      "midTermDetails",
                      mtrDetailsInsertData,
                      "user",
                      "midTermDetails",
                      "ADDED"
                    );
                    // sendEmailToAllEmployee(emp_id_array, res);
                    return res.status(200).json({ result: midTermDetails });
                  }
                });
              }
            });
          }
        });
      });
    }
  });
}
function GetMtrKraSingleDetails(req, res) {
  let emp_id = parseInt(req.query.emp_id);
  MidTermDetails.aggregate([
    {
      $lookup: {
        from: "midtermmasters",
        localField: "mtr_master_id",
        foreignField: "_id",
        as: "mtr_master_details"
      }
    },
    {
      $unwind: {
        path: "$mtr_master_details"
      }
    },
    {
      $lookup: {
        from: "midtermbatches",
        localField: "mtr_batch_id",
        foreignField: "_id",
        as: "mtr_batch"
      }
    },
    {
      $unwind: {
        path: "$mtr_batch"
      }
    },
    {
      $lookup: {
        from: "employeedetails",
        localField: "mtr_batch.createdBy",
        foreignField: "_id",
        as: "mtr_batch_creator"
      }
    },
    {
      $unwind: {
        path: "$mtr_batch_creator"
      }
    },
    {
      $lookup: {
        from: "kradetails",
        localField: "kraDetailId",
        foreignField: "_id",
        as: "kra_details"
      }
    },
    {
      $lookup: {
        from: "employeedetails",
        localField: "mtr_master_details.emp_id",
        foreignField: "_id",
        as: "emp_details"
      }
    },
    {
      $unwind: {
        path: "$emp_details"
      }
    },
    {
      $lookup: {
        from: "employeedetails",
        localField: "supervisor_id",
        foreignField: "_id",
        as: "emp_supervisor_details"
      }
    },
    {
      $unwind: {
        path: "$emp_supervisor_details",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: "$_id",
        mtr_master_kraWorkflow_id: "$kraWorkflow_id",
        mtr_master_kraDetailId: "$kraDetailId",
        mtr_master_emp_comment: "$emp_comment",
        mtr_master_supervisor_comment: "$supervisor_comment",
        mtr_master_supervisor_id: "$supervisor_id",
        mtr_batch_id: "$mtr_batch_id",
        mtr_batch: "$mtr_batch",
        mtr_batch_creator: {
          _id: 1,
          userName: 1,
          fullName: 1
        },
        mtr_master_id: "$mtr_master_id",
        mtr_master_status: "$mtr_master_details.status",
        emp_id: "$mtr_master_details.emp_id",
        emp_userName: "$emp_details.userName",
        emp_full_name: "$emp_details.fullName",
        supervisor_userName: "$emp_supervisor_details.userName",
        supervisor_full_name: "$emp_supervisor_details.fullName",
        kra_details: "$kra_details",
        mtr_kra: "$mtr_kra",
        weightage_id: "$weightage_id",
        category_id: "$category_id",
        unitOfSuccess: "$unitOfSuccess",
        measureOfSuccess: "$measureOfSuccess",
        status: "$status",
        employeeComment: "$employeeComment",
        supervisorComment: "$supervisorComment"
      }
    },
    {
      $match: {
        emp_id: emp_id
      }
    }
  ]).exec(function (err, data) {
    if (err) {
      return res.status(403).json({
        title: "There was a problem",
        error: {
          message: err
        },
        result: {
          message: data
        }
      });
    } else {
      return res.status(200).json({
        title: "Mid term master details",
        result: {
          message: data
        }
      });
    }
  });
}
function getMtrBySupervisor(req, res) {
  let supervisorId = parseInt(req.query.supervisorId);
  let status = req.query.status;
  MidTermDetails.aggregate([
    {
      $match: {
        supervisor_id: supervisorId
      }
    },
    {
      $lookup: {
        from: "midtermmasters",
        localField: "mtr_master_id",
        foreignField: "_id",
        as: "mtr_master_details"
      }
    },
    {
      $unwind: {
        path: "$mtr_master_details"
      }
    },
    {
      $lookup: {
        from: "employeedetails",
        localField: "mtr_master_details.emp_id",
        foreignField: "_id",
        as: "emp_details"
      }
    },
    {
      $unwind: {
        path: "$emp_details"
      }
    },
    {
      $project: {
        mtrMasterId: "$mtr_master_id",
        emp_details: "$emp_details",
        mtr_master_details: "$mtr_master_details",
        status: "$mtr_master_details.status"
      }
    },
    { $match: { status: status } },
    {
      $group: {
        _id: "$mtrMasterId",
        emp_details: { $first: "$emp_details" },
        mtr_master_details: { $first: "$mtr_master_details" }
      }
    }
  ]).exec(function (err, data) {
    if (err) {
      return res.status(403).json({
        title: "There was a problem",
        error: {
          message: err
        },
        result: {
          message: data
        }
      });
    } else {
      return res.status(200).json({
        title: "Mid term master data",
        result: {
          message: data
        }
      });
    }
  });
}
function getMtrBatches(req, res) {
  let currentUserId = parseInt(req.query.empId);
  MidTermBatch.aggregate([
    {
      $match: {
        createdBy: currentUserId
      }
    },
    {
      $lookup: {
        from: "midtermmasters",
        localField: "_id",
        foreignField: "batch_id",
        as: "mtr_master"
      }
    },
    {
      $unwind: {
        path: "$mtr_master",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "employeedetails",
        localField: "mtr_master.emp_id",
        foreignField: "_id",
        as: "emp_details"
      }
    },
    {
      $unwind: {
        path: "$emp_details",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 1,
        updatedAt: 1,
        createdAt: 1,
        isDeleted: 1,
        status: 1,
        updatedBy: 1,
        createdBy: 1,
        batchEndDate: 1,
        batchName: 1,
        mtr_master: {
          _id: 1,
          updatedAt: 1,
          createdAt: 1,
          batch_id: 1,
          emp_id: 1,
          isDeleted: 1,
          createdBy: 1,
          updatedBy: 1,
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
        isDeleted: { $first: "$isDeleted" },
        status: { $first: "$status" },
        updatedBy: { $first: "$updatedBy" },
        createdBy: { $first: "$createdBy" },
        batchEndDate: { $first: "$batchEndDate" },
        batchName: { $first: "$batchName" },
        mtr_master: { $push: "$mtr_master" }
      }
    }
  ]).exec(function (err, data) {
    if (err) {
      return res.status(403).json({
        title: "There was a problem",
        error: {
          message: err
        },
        result: {
          message: data
        }
      });
    } else {
      return res.status(200).json({
        title: "Mid term master data",
        result: {
          message: data
        }
      });
    }
  });
}
function InsertNewKRAInMtr(req, res) {
  let mtrDetails = new MidTermDetails();
  mtrDetails.mtr_master_id = parseInt(req.body.mtr_master_id);
  mtrDetails.mtr_kra = req.body.mtr_kra;
  mtrDetails.supervisor_id = parseInt(req.body.supervisor_id);
  mtrDetails.mtr_batch_id = parseInt(req.body.mtr_batch_id);
  mtrDetails.weightage_id = parseInt(req.body.weightage_id);
  mtrDetails.category_id = parseInt(req.body.category_id);
  mtrDetails.unitOfSuccess = req.body.unitOfSuccess;
  mtrDetails.measureOfSuccess = req.body.measureOfSuccess;
  mtrDetails.isDeleted = req.body.isDeleted;
  mtrDetails.createdBy = parseInt(req.body.createdBy);
  mtrDetails.employeeComment = req.body.employeeComment;
  mtrDetails.status = "Pending";
  mtrDetails.save(function (err, response) {
    if (err) {
      return res.status(403).json({
        title: "There is a problem",
        error: {
          message: err
        },
        result: {
          message: response
        }
      });
    } else {
      AuditTrail.auditTrailEntry(
        0,
        "MidTermDetails",
        response,
        "user",
        "MidTermDetails",
        "ADDED"
      );
      return res.status(200).json({
        title: "New KRA added",
        result: {
          message: response
        }
      });
    }
  });
}
function updateMtr(req, res) {
  let updateQuery = {
    weightage_id: parseInt(req.body.weightage_id),
    employeeComment: req.body.employeeComment,
    updatedBy: parseInt(req.body.empId),
    updatedAt: new Date()
  };

  MidTermDetails.findOneAndUpdate({ _id: parseInt(req.body._id) }, updateQuery, (err, response) => {
    if (err) {
      return res.status(403).json({
        title: "There is a problem",
        error: {
          message: err
        },
        result: {
          message: response
        }
      });
    } else {
      AuditTrail.auditTrailEntry(
        0,
        "MidTermDetails",
        response,
        "user",
        "MidTermDetails",
        "UPDATED"
      );
      return res.status(200).json({
        title: "MTR Updated",
        result: {
          message: response
        }
      });
    }
  });
}
function DeleteKraInMtr(req, res) {
  MidTermDetails.remove({ _id: parseInt(req.body.id) }, function (err, response) {
    if (err) {
      return res.status(403).json({
        title: "There is a problem",
        error: {
          message: err
        },
        result: {
          message: response
        }
      });
    } else {
      AuditTrail.auditTrailEntry(
        0,
        "MidTermDetails",
        response,
        "user",
        "MidTermDetails",
        "Deleted"
      );
      return res.status(200).json({
        title: "Midterm Kra deleted",
        result: {
          message: response
        }
      });
    }
  });
}
function SubmitMidTermReview(req, res) {
  let mtrDetailId = parseInt(req.body.id);
  let emp_id = parseInt(req.body.empId);
  let updateCondition = { mtr_master_id: mtrDetailId };
  let updateQuery = { status: "Submitted", updatedBy: emp_id, updatedAt: new Date() }
  async.waterfall([
    (done) => {
      MidTermDetails.updateMany(updateCondition, updateQuery, function (err, response) {
        done(err, response);
      })
    },
    (response1, done) => {
      MidTermMaster.findOneAndUpdate({ _id: mtrDetailId }, updateQuery, (err, doc) => {
        done(err, doc);
      });
    }
  ], (err, result) => {
    if (err) {
      return res.status(403).json({
        title: "There is a problem",
        error: {
          message: err
        },
        result: {
          message: result
        }
      });
    } else {
      return res.status(200).json({
        title: "Midterm review submitted",
        result: {
          message: result
        }
      });
    }
  })
}

function getMtrDetails(req, res) {
  let mtrMasterId = parseInt(req.query.mtrMasterId);
  MidTermMaster.aggregate([
    {
      $match: { _id: mtrMasterId }
    },
    {
      $lookup: {
        from: "midtermdetails",
        localField: "_id",
        foreignField: "mtr_master_id",
        as: "mtr_details"
      }
    }
  ]).exec(function (err, data) {
    if (err) {
      return res.status(403).json({
        title: "There was a problem",
        error: {
          message: err
        },
        result: {
          message: data
        }
      });
    } else {
      return res.status(200).json({
        title: "Mid term Master & Details",
        result: {
          message: data
        }
      });
    }
  });
}

function mtrApproval(req, res) {
  let mtrDetailId = parseInt(req.body.mtrDetailId);
  let updateQuery = {
    supervisorComment: req.body.supervisorComment,
    updatedBy: parseInt(req.body.empId),
    updatedAt: new Date()
  };
  if (req.body.isApproved == true) {
    updateQuery.status = 'Approved';
  } else {
    updateQuery.status = 'SendBack';
  }
  MidTermDetails.findOneAndUpdate({ _id: mtrDetailId }, updateQuery, (err, doc, resp) => {
    if (err) {
      return res.status(403).json({
        title: "There is a problem",
        error: {
          message: err
        },
        result: {
          message: doc
        }
      });
    }

    return res.status(200).json({
      title: "Midterm Review Approved/SendBack",
      result: {
        message: doc
      }
    });
  })
}

function getMtrByReviewer(req, res) {
  let reviewerId = parseInt(req.query.reviewerId);

  EmployeeSupervisorDetails.aggregate([
    {
      $match: { primarySupervisorEmp_id: reviewerId }
    },
    {
      $lookup: {
        from: "midtermdetails",
        localField: "emp_id",
        foreignField: "supervisor_id",
        as: "mtr_details"
      }
    },
    {
      $unwind: {
        path: "$mtr_details"
      }
    },
    {
      $lookup: {
        from: "midtermmasters",
        localField: "mtr_details.mtr_master_id",
        foreignField: "_id",
        as: "mtr_master_details"
      }
    },
    {
      $unwind: {
        path: "$mtr_master_details"
      }
    },
    {
      $lookup: {
        from: "employeedetails",
        localField: "mtr_master_details.emp_id",
        foreignField: "_id",
        as: "emp_details"
      }
    },
    {
      $unwind: {
        path: "$emp_details"
      }
    },
    {
      $project: {
        mtrMasterId: "$mtr_master_id",
        emp_details: "$emp_details",
        mtr_master_details: "$mtr_master_details",
        status: "$mtr_master_details.status"
      }
    },
    // { $match: { status: status } },
    {
      $group: {
        _id: "$mtrMasterId",
        emp_details: { $first: "$emp_details" },
        mtr_master_details: { $first: "$mtr_master_details" }
      }
    }
  ]).exec(function (err, data) {
    if (err) {
      return res.status(403).json({
        title: "There was a problem",
        error: {
          message: err
        },
        result: {
          message: data
        }
      });
    } else {
      return res.status(200).json({
        title: "Mid term Data by Reviewer",
        result: {
          message: data
        }
      });
    }
  });
}

let functions = {
  getEmpDetailsForMidTermInitiate: (req, res) => {
    EmpDetailsForMidTermInitiate(req, res);
  },
  initiateMidTermProcess: (req, res) => {
    InitiateMtrProcess(req, res);
  },
  getMtrDetailsSingleEmployee: (req, res) => {
    GetMtrKraSingleDetails(req, res);
  },
  getMtrBySupervisor: (req, res) => {
    getMtrBySupervisor(req, res);
  },
  getMtrBatches: (req, res) => {
    getMtrBatches(req, res);
  },
  postNewMtrKra: (req, res) => {
    InsertNewKRAInMtr(req, res);
  },
  updateMtr: (req, res) => {
    updateMtr(req, res);
  },
  deleteMtrKra: (req, res) => {
    DeleteKraInMtr(req, res);
  },
  mtrSubmit: (req, res) => {
    SubmitMidTermReview(req, res);
  },
  getMtrDetails: (req, res) => {
    getMtrDetails(req, res);
  },
  mtrApproval: (req, res) => {
    mtrApproval(req, res);
  },
  getMtrByReviewer: (req, res) => {
    getMtrByReviewer(req, res);
  }
};

module.exports = functions;
