let KraWorkFlowInfo = require("../models/kra/kraWorkFlowDetails.model"),
  MidTermBatch = require("../models/midterm/midtermbatch"),
  MidTermMaster = require("../models/midterm/midtermmaster"),
  AuditTrail = require("../class/auditTrail");
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
        from: "mtrmaster",
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
        emp_HRSpoc_id: "$employee_office_details.htspoc_id",
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
  ]).exec(function(err, response) {
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
  MidTermBatchDetails.save(function(err, midtermbatchresp) {
    if (err) {
      console.log(err);
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
      ]).then(function(counts) {
        let insertData = [];
        let midtermMaster_id =
          counts[0][0] === undefined ? 1 : counts[0][0]._id;
        emp_id_array.forEach(function(element, index) {
          insertData.push({
            batch_id: batch_id,
            emp_id: element.emp_id,
            status: "Initiated",
            _id: midtermMaster_id + (index + 1),
            createdBy: createdBy
          });
        });
        MidTermMaster.insertMany(insertData, function(
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
            return res.status(200).json({ result: midTermMasterResult });
          }
        });
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
  }
};
module.exports = functions;
