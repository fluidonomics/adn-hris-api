let KraWorkFlowInfo = require("../models/kra/kraWorkFlowDetails.model");
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
        "from": "mtrmaster",
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

let functions = {
  getEmpDetailsForMidTermInitiate: (req, res) => {
    EmpDetailsForMidTermInitiate(req, res);
  }
};
module.exports = functions;
