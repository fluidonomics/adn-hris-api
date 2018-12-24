let async = require('async'),
  MidTermMaster = require('../models/midterm/midtermmaster'),
  MidTermDetail = require('../models/midterm/midtermdetails'),
  AuditTrail = require('../class/auditTrail');

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
        emp_emailId: '$employee_office_details.officeEmail'
      }
    }
  ]).exec(function(err, response) {
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


let functions = {
  getEmployeesForPapInitiate: (req, res) => {
    getEmployeesForPapInitiate(req, res);
  }
}

module.exports = functions;