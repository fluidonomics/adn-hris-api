let KraWorkFlowInfo = require("../models/kra/kraWorkFlowDetails.model"),
  MidTermBatch = require("../models/midterm/midtermbatch"),
  MidTermMaster = require("../models/midterm/midtermmaster"),
  MidTermDetails = require("../models/midterm/midtermdetails"),
  AuditTrail = require("../class/auditTrail");
function EmpDetailsForMidTermInitiate(req, res) {
  KraWorkFlowInfo.aggregate([
    {
      "$project": {
        "emp_id": "$emp_id",
        "batch_id": "$batch_id",
        "status": "$status"
      }
    },
    {
      "$lookup": {
        "from": "employeedetails",
        "localField": "emp_id",
        "foreignField": "_id",
        "as": "employee_details"
      }
    },
    {
      "$unwind": {
        "path": "$employee_details"
      }
    },
    {
      "$lookup": {
        "from": "employeeofficedetails",
        "localField": "emp_id",
        "foreignField": "emp_id",
        "as": "employee_office_details"
      }
    },
    {
      "$unwind": {
        "path": "$employee_office_details"
      }
    },
    {
      "$lookup": {
        "from": "midtermmasters",
        "localField": "emp_id",
        "foreignField": "emp_id",
        "as": "mtr_master_details"
      }
    },
    {
      "$unwind": {
        "path": "$mtr_master_details",
        "preserveNullAndEmptyArrays": true
      }
    },
    {
      "$lookup": {
        "from": "designations",
        "localField": "employee_details.designation_id",
        "foreignField": "_id",
        "as": "designation_details"
      }
    },
    {
      "$unwind": {
        "path": "$designation_details"
      }
    },
    {
      "$lookup": {
        "from": "employeesupervisordetails",
        "localField": "emp_id",
        "foreignField": "emp_id",
        "as": "employee_supervisor_details"
      }
    },
    {
      "$unwind": {
        "path": "$employee_supervisor_details"
      }
    },
    {
      "$lookup": {
        "from": "employeedetails",
        "localField": "employee_supervisor_details.primarySupervisorEmp_id",
        "foreignField": "_id",
        "as": "supervisor_details"
      }
    },
    {
      "$unwind": {
        "path": "$supervisor_details"
      }
    },
    {
      "$project": {
        "emp_id": "$emp_id",
        "kra_batch_id": "$batch_id",
        "kra_status": "$status",
        "emp_full_name": "$employee_details.fullName",
        "emp_grade_id": "$employee_details.grade_id",
        "emp_isAccountActive": "$employee_details.isAccountActive",
        "emp_profileImage": "$employee_details.profileImage",
        "emp_userName": "$employee_details.userName",
        "emp_employmentType_id": "$employee_details.employmentType_id",
        "emp_isDeleted": "$employee_details.isDeleted",
        "emp_department_id": "$employee_office_details.department_id",
        "emp_HRSpoc_id": "$employee_office_details.htspoc_id",
        "emp_officeEmail": "$employee_office_details.officeEmail",
        "emp_designation_id": "$employee_details.designation_id",
        "emp_designation_name": "$designation_details.designationName",
        "emp_supervisor_id": "$employee_supervisor_details.primarySupervisorEmp_id",
        "emp_supervisor_name": "$supervisor_details.fullName",
        "mtr_status": "$mtr_master_details.status",
        "mtr_batch_id": "$mtr_master_details.batch_id"
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
  MidTermBatchDetails.transac
  MidTermBatchDetails.save(function (err, midtermbatchresp) {
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
      AuditTrail.auditTrailEntry(0, "MidTermBatchDetails", midtermbatchresp, "user", "MidTermBatchDetails", "ADDED");
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
          counts[0][0] === undefined ? 1 : counts[0][0]._id;
        emp_id_array.forEach(function (element, index) {
          insertData.push({
            batch_id: batch_id, emp_id: element.emp_id, status: "Initiated", _id: midtermMaster_id + (index + 1),
            createdBy: createdBy
          });
        });
        MidTermMaster.insertMany(insertData, function (err, midTermMasterResult) {
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
            AuditTrail.auditTrailEntry(0, "MidTermMaster", insertData, "user", "MidTermMaster", "ADDED");
            let emp_id_collection = [];
            emp_id_array.forEach(element => {
              emp_id_collection.push(element.emp_id);
            });
            Promise.all([
              KraWorkFlowInfo.aggregate(
                [
                  {
                    "$match": {
                      "emp_id": {
                        "$in": emp_id_collection
                      },
                      "status": "Initiated"
                    }
                  },
                  {
                    "$lookup": {
                      "from": "kradetails",
                      "localField": "_id",
                      "foreignField": "kraWorkflow_id",
                      "as": "kra_details"
                    }
                  },
                  {
                    "$unwind": {
                      "path": "$kra_details",
                      "preserveNullAndEmptyArrays": true
                    }
                  },
                  {
                    "$project": {
                      "kra_batch_id": "$batch_id",
                      "kra_emp_id": "$emp_id",
                      "kra_status": "$status",
                      "kra_details_isDeleted": "$kra_details.isDeleted",
                      "kra_details_sendBackComment": "$kra_details.sendBackComment",
                      "kra_details_supervisorStatus": "$kra_details.supervisorStatus",
                      "kra_details_measureOfSuccess": "$kra_details.measureOfSuccess",
                      "kra_details_unitOfSuccess": "$kra_details.unitOfSuccess",
                      "kra_details_weightage_id": "$kra_details.weightage_id",
                      "kra_details_category_id": "$kra_details.category_id",
                      "kra_details_kra": "$kra_details.kra",
                      "kra_Details_id": "$kra_details._id"
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
              ])]
            ).then(function (responses, err) {
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
                let mtrDetailsMaxId = responses[1][0] === undefined ? 1 : responses[1][0]._id;
                kraWorklowResp.forEach((f) => {
                  f.mtr_batch_id = midTermMasterResult.find(f1 => f1.emp_id === f.kra_emp_id).batch_id;
                  f.mtr_master_id = midTermMasterResult.find(f1 => f1.emp_id === f.kra_emp_id)._id;
                  f.emp_supervisor_id = emp_id_array.find(f1 => f1.emp_id === f.kra_emp_id).supervisor_id;
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
                      isDeleted: false
                    });
                  } else {

                  }
                });
                MidTermDetails.insertMany(mtrDetailsInsertData, function (err, midTermDetails) {
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
                    AuditTrail.auditTrailEntry(0, "midTermDetails", mtrDetailsInsertData, "user", "midTermDetails", "ADDED");
                    // sendEmailToAllEmployee(emp_id_array, res);
                    return res.status(200).json({ result: midTermDetails });
                  }
                });
              }
            })
          }
        });
      });
    }
  });
}
function GetMtrKraSingleDetails(req, res) {
  let emp_id = parseInt(req.body.emp_id);
  MidTermDetails.aggregate([
    {
      "$lookup": {
        "from": "midtermmasters",
        "localField": "mtr_master_id",
        "foreignField": "_id",
        "as": "mtr_master_details"
      }
    },
    {
      "$unwind": {
        "path": "$mtr_master_details"
      }
    },
    {
      "$lookup": {
        "from": "kradetails",
        "localField": "kraDetailId",
        "foreignField": "_id",
        "as": "kra_details"
      }
    },
    {
      "$lookup": {
        "from": "employeedetails",
        "localField": "mtr_master_details.emp_id",
        "foreignField": "_id",
        "as": "emp_details"
      }
    },
    {
      "$unwind": {
        "path": "$emp_details"
      }
    },
    {
      "$lookup": {
        "from": "employeedetails",
        "localField": "supervisor_id",
        "foreignField": "_id",
        "as": "emp_supervisor_details"
      }
    },
    {
      "$unwind": {
        "path": "$emp_supervisor_details"
      }
    },
    {
      "$project": {
        "_id": "$_id",
        "mtr_master_kraWorkflow_id": "$kraWorkflow_id",
        "mtr_master_kraDetailId": "$kraDetailId",
        "mtr_master_emp_comment": "$emp_comment",
        "mtr_master_supervisor_comment": "$supervisor_comment",
        "mtr_master_supervisor_id": "$supervisor_id",
        "mtr_batch_id": "$mtr_batch_id",
        "mtr_master_id": "$mtr_master_id",
        "mtr_master_status": "$status",
        "emp_id": "$mtr_master_details.emp_id",
        "emp_userName": "$emp_details.userName",
        "emp_full_name": "$emp_details.fullName",
        "supervisor_userName": "$emp_supervisor_details.userName",
        "supervisor_full_name": "$emp_supervisor_details.fullName",
        "kra_details": "$kra_details"
      }
    },
    {
      "$match": {
        "emp_id": emp_id
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
let functions = {
  getEmpDetailsForMidTermInitiate: (req, res) => {
    EmpDetailsForMidTermInitiate(req, res);
  },
  initiateMidTermProcess: (req, res) => {
    InitiateMtrProcess(req, res);
  },
  getMtrDetailsSingleEmployee: (req, res) => {
    GetMtrKraSingleDetails(req, res);
  }
};
module.exports = functions;
