let LearningBatch = require("../models/learning/learningbatch"),
LearningMaster = require("../models/learning/learningmaster"),
LearningDetails = require("../models/learning/learningdetails"),
AuditTrail = require("../class/auditTrail"),
SendEmail = require('../class/sendEmail'),
EmployeeSupervisorDetails = require("../models/employee/employeeSupervisorDetails.model");


function InitiateLearning(req, res) {
    let createdBy = parseInt(req.body.createdBy);
    let LearningBatchDetails = new LearningBatch();
    LearningBatchDetails.batchName = req.body.batchName;
    LearningBatchDetails.batchEndDate = new Date(
      new Date(req.body.batchEndDate).getTime()
    );
    LearningBatchDetails.status = req.body.status;
    LearningBatchDetails.isDeleted = false;
    LearningBatchDetails.createdBy = createdBy;
    let emp_id_array = req.body.emp_id_array;
    LearningBatchDetails.transac;
    let email_details = {
      emp_email: '',
      emp_name: '',
      hr_name: req.body.createdByName,
      action_link: req.body.action_link
    };
    LearningBatchDetails.save(function (err, learningbatchresp) {
      if (err) {
        return res.status(403).json({
          title: "There was a problem",
          error: {
            message: err
          },
          result: {
            message: learningbatchresp
          }
        });
      } else {
        AuditTrail.auditTrailEntry(
          0,
          "LearningBatchDetails",
          learningbatchresp,
          "user",
          "LearningBatchDetails",
          "ADDED"
        );
        let batch_id = learningbatchresp.id;
        Promise.all([
            LearningMaster.aggregate([
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
          let learningMaster_id =
            counts[0][0] === undefined ? 0 : counts[0][0]._id;
          emp_id_array.forEach(function (element, index) {
            insertData.push({
              batch_id: batch_id,
              emp_id: element.emp_id,
              status: "Initiated",
              _id: learningMaster_id + (index + 1),
              createdBy: createdBy
            });
          });
          LearningMaster.insertMany(insertData, function (
            err,
            learningMasterResult
          ) {
            if (err) {
              return res.status(403).json({
                title: "There was a problem",
                error: {
                  message: err
                },
                result: {
                  message: learningMasterResult
                }
              });
            } else {
              AuditTrail.auditTrailEntry(
                0,
                "LearningMaster",
                insertData,
                "user",
                "LearningMaster",
                "ADDED"
              );
              sendEmailToEmployee(emp_id_array, res, email_details);
              //return res.status(200).json({ result: learningMasterResult });
            }
          });
        });
      }
    });
    //sendEmailToAllEmployee(emp_id_array, res, email_details);
}

function sendEmailToEmployee(emp_id_array, res, email_details) {

  EmployeeDetails.aggregate([
    {
      "$lookup": {
        "from": "employeeofficedetails",
        "localField": "_id",
        "foreignField": "emp_id",
        "as": "office_details"
      }
    },
    {
      "$unwind": {
        "path": "$office_details"
      }
    },
    {
      "$match": {
        "_id": {"$in": emp_id_array.map(emp => {return emp.emp_id}) },
      }
    },
    {
      "$project": {
        "_id": "$_id",
        "user_name": "$fullName",
        "officeEmail": "$office_details.officeEmail"
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
      //let count = 0;
      data.forEach(f => { 
        email_details.emp_name = f.user_name;
        email_details.emp_email = f.officeEmail;
        //forEwach {
        SendEmail.sendEmailToEmployeeForInitiateLearning(email_details, (email_err, email_result) => {

        });
        
      });
      // if(count == data.length) {

        return res.status(200).json({
          title: "Learning initiated, and email sent to employee",
          // result: {
          //   message: email_result
          // }
        });
      // } else {

      //   return res.status(300).json({
      //       title: "Learning initiated, failed sending email to employee",
      //       // error: {
      //       //   message: email_err
      //       // },
      //       // result: {
      //       //   message: email_result
      //       // }
      //     });
      // }
        //}
        // return res.status(200).json({
        //   title: "Learning initiated, and email sent to employee",
        //   result: {
        //     message: "email sent"
        //   }
        // });
        // SendEmail.sendEmailToSupervisorToApproveLearning(email_details, (email_err, email_result) => {

        //   if (email_err) {
            // return res.status(300).json({
            //   title: "Learning initiated, failed sending email to employee",
            //   error: {
            //     message: email_err
            //   },
            //   result: {
            //     message: email_result
            //   }
            // });
        //   } else {
        //     return res.status(200).json({
        //       title: "Learning initiated, and email sent to employee",
        //       result: {
        //         message: email_result
        //       }
        //     });
        //   }
        // });
    }
  });
}

function GetLearningSingleEmployee(req, res) {

  let emp_id = parseInt(req.query.emp_id);
  LearningMaster.aggregate([
    {
      $match: {
        emp_id: emp_id
      }
    },
    {
      $lookup: {
        from: "learningbatches",
        localField: "batch_id",
        foreignField: "_id",
        as: "learning_master_details"
      }
      
    },
    {
      $unwind: {
        path: "$learning_master_details"
      }
    },

    {
      $lookup: {
        from: "employeedetails",
        localField: "learning_master_details.createdBy",
        foreignField: "_id",
        as: "learning_batch_creator"
      }
    },
    {
      $unwind: {
        path: "$learning_batch_creator"
      }
    },
    {
      $project: {

        learning_batch_name: "$learning_master_details.batchName",
        createdby: "$learning_master_details.createdBy",
        createdAt: "$learning_master_details.createdAt",
        updatedAt: "$learning_master_details.updatedAt",
        batchEndDate: "$learning_master_details.batchEndDate",
        status: "$status",
        batchName: "$learning_master_details._id",
        createdByName: "$learning_batch_creator.fullName"

      }
    },
    { $sort : { createdAt : -1} }
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
        title: "learning master details",
        result: {
          message: data
        }
      });
    }
  });
}

function InsertLearning(req, res) {

  let learningDetails = new LearningDetails();
  learningDetails.master_id = parseInt(req.body.master_id);
  learningDetails.supervisor_id = parseInt(req.body.supervisorId);
  learningDetails.status = req.body.status;
  learningDetails.measureOfSuccess = req.body.measureOfSuccess;
  learningDetails.isDeleted = req.body.isDeleted;
  learningDetails.createdBy = parseInt(req.body.createdBy);
  learningDetails.updatedBy = parseInt(req.body.updatedBy);
  learningDetails.progressStatus = req.body.progressStatus;
  learningDetails.developmentArea = req.body.developmentArea;
  learningDetails.developmentPlan = req.body.developmentPlan;
  learningDetails.timelines = req.body.timelines;
  learningDetails.supportRequired = req.body.supportRequired;
  learningDetails.supervisorComment = req.body.supervisorComment;
  learningDetails.employeeComment = req.body.employeeComment;
  learningDetails.completionDate = req.body.completionDate;

  if(req.body._id != null) {

    let updateQuery = {
      weightage_id: req.body.weightage_id
        ? parseInt(req.body.weightage_id)
        : null,
      supervisor_id: parseInt(req.body.supervisorId),
      measureOfSuccess: req.body.measureOfSuccess,
      progressStatus: req.body.progressStatus,
      employeeComment: req.body.employeeComment,
      status: req.body.status,
      developmentArea: req.body.developmentArea,
      supportRequired: req.body.supportRequired,
      developmentPlan: req.body.developmentPlan,
      timelines: req.body.timelines,
      updatedBy: parseInt(req.body.updatedBy),
      updatedAt: new Date(),
      completionDate: req.body.completionDate
    };
  
    LearningDetails.findOneAndUpdate(
      { _id: parseInt(req.body._id) },
      updateQuery,
      (err, response) => {
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
            "LearningDetails",
            response,
            "user",
            "LearningDetails",
            "UPDATED"
          );
          return res.status(200).json({
            title: "Learning Updated",
            result: {
              message: response
            }
          });
        }
      }
    );
  } else {

    learningDetails.save(function (err, response) {
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
          "LearningDetails",
          response,
          "user",
          "LearningDetails",
          "ADDED"
        );
        return res.status(200).json({
          title: "New Topic Added",
          result: {
            message: response
          }
        });
      }
    });
  }
}

function GetLearningDetailsEmployee(req, res) {

  let master_id = parseInt(req.query.master_id);
  LearningDetails.aggregate([
    {
      $match: {
        master_id: master_id
      }
    },
    {
      $lookup: {
        from: "learningmasters",
        localField: "master_id",
        foreignField: "_id",
        as: "learning_details"
      }
    },
    {
      $unwind: {
        path: "$learning_details"
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
      $lookup: {
        from: "employeedetails",
        localField: "learning_details.emp_id",
        foreignField: "_id",
        as: "emp_image_details"
      }
    },
    {
      $unwind: {
        path: "$emp_image_details",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {

        id: "$_id",
        createdby: "$createdBy",
        createdAt: "createdAt",
        updatedBy: "$updatedBy",
        updatedAt: "$updatedAt",
        masterId: "$learning_details._id",
        status: "$status",
        progressStatus: "$progressStatus",
        supervisorId: "$supervisor_id",
        developmentArea: "$developmentArea",
        developmentPlan: "$developmentPlan",
        timelines: "$timelines",
        supportRequired: "$supportRequired",
        supervisorComment: "$supervisorComment",
        measureOfSuccess: "$measureOfSuccess",
        employeeComment: "$employeeComment",
        supervisor_name: "$emp_supervisor_details.fullName",
        completionDate: "$completionDate",
        profileImage: "$emp_image_details.profileImage"
      }
    },
    { $sort : { createdAt : -1} }

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
        title: "learning details",
        result: {
          message: data
        }
      });
    }
  });
}

function getLearningBySupervisor(req, res) {

  let supervisor_id = parseInt(req.query.supervisorId);
  let status = req.query.status;
  LearningDetails.aggregate([
    {
      $match: {
        supervisor_id: supervisor_id
      }
    },
    {
      $lookup: {
        from: "learningmasters",
        localField: "master_id",
        foreignField: "_id",
        as: "learning_master_details"
      }
    },
    {
      $unwind: {
        path: "$learning_master_details"
      }
    },
    {
      $lookup: {
        from: "employeedetails",
        localField: "learning_master_details.emp_id",
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
        learningMasterId: "$master_id",
        emp_details: "$emp_details",
        learning_master_details: "$learning_master_details",
        status: "$learning_master_details.status",
        updatedAt: "$learning_master_details.updatedAt",
        //profileImage: "$emp_details.profileImage"
      }
    },
    { $match: { status: status } },
    {
      $group: {
        _id: "$learningMasterId",
        emp_details: { $first: "$emp_details" },
        learning_master_details: { $first: "$learning_master_details" },
        updatedAt: { $first: "$learning_master_details.updatedAt" }
      }
    },
    { $sort : { updatedAt : -1} },
    
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
        title: "Learning master data",
        result: {
          message: data
        }
      });
    }
  });

}

function submitEmployeeLearning(req, res) {

  let learning_master_id = parseInt(req.body.masterId);
  let emp_id = parseInt(req.body.empId);
  let supervisor_id = parseInt(req.body.supervisorId);
  let email_details = {
    supervisor_email: '',
    supervisor_name: '',
    user_name: req.body.emp_name,
    action_link: req.body.action_link
  };

  let updateCondition = { master_id: learning_master_id, status: ["initiated", "SendBack"] };
  let updateQuery = {
    status: "Submitted",
    updatedBy: emp_id,
    updatedAt: new Date()
  };

  async.waterfall(
    [
      done => {
        LearningDetails.updateMany(updateCondition, updateQuery, function (
          err,
          response
        ) {
          done(err, response);
        });
      },
      (response1, done) => {
        LearningMaster.findOneAndUpdate(
          { _id: learning_master_id },
          updateQuery,
          (err, doc) => {
            done(err, doc);
          }
        );
      },
      (response2, done) => {
        EmployeeDetails.aggregate(
          [
            {
              "$lookup": {
                "from": "employeeofficedetails",
                "localField": "_id",
                "foreignField": "emp_id",
                "as": "office_details"
              }
            },
            {
              "$unwind": {
                "path": "$office_details"
              }
            },
            {
              "$match": {
                "_id": supervisor_id
              }
            },
            {
              "$project": {
                "_id": "$_id",
                "user_name": "$fullName",
                "officeEmail": "$office_details.officeEmail"
              }
            }
          ]).then((doc, err) => {
            let finalData = { learningmaster: response2, emp: doc }
            done(err, finalData);
          });
      }
    ],
    (err, result) => {
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
        email_details.supervisor_name = result.emp[0].user_name;
        email_details.supervisor_email = result.emp[0].officeEmail;
        SendEmail.sendEmailToSupervisorToApproveLearning(email_details, (email_err, email_result) => {
          if (email_err) {
            return res.status(300).json({
              title: "Learning submitted, failed sending email to supervisor",
              error: {
                message: email_err
              },
              result: {
                message: email_result
              }
            });
          } else {
            return res.status(200).json({
              title: "Learning submitted, and email sent to supervisor",
              result: {
                message: email_result
              }
            });
          }
        });
      }
    }
  );

}

function getLearningByReviewer(req, res) {

  let reviewerId = parseInt(req.query.reviewerId);
  //console.log("primary id : ", primarySupervisorEmp_id);
  let statusTemp = "Approved";

  EmployeeSupervisorDetails.aggregate([
    {
      $match: { primarySupervisorEmp_id: reviewerId }
    },
    {
      $lookup: {
        from: "learningdetails",
        localField: "emp_id",
        foreignField: "supervisor_id",
        as: "learning_details"
      }
    },
    {
      $unwind: {
        path: "$learning_details"
      }
    },
    {
      $lookup: {
        from: "learningmasters",
        localField: "learning_details.master_id",
        foreignField: "_id",
        as: "learning_master_details"
      }
    },
    {
      $unwind: {
        path: "$learning_master_details"
      }
    },
    {
      $lookup: {
        from: "employeedetails",
        localField: "learning_master_details.emp_id",
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
        learningMasterId: "$learning_master_details._id",
        emp_details: "$emp_details",
        //learning_details: "$learning_details",
        learning_master_details: "$learning_master_details",
        status: "$learning_master_details.status",
        updatedAt: "$learning_master_details.updatedAt"
      }
    },
    { $match: { status: statusTemp } },
    {
      $group: {
        _id: "$learningMasterId",
        // emp_details: "$emp_details",
        // learning_master_details: "$learning_master_details",
        // learning_details: "$learning_details"
        emp_details: { $first: "$emp_details" },
        learning_master_details: { $first: "$learning_master_details" },
        learning_details: { $first: "$learning_details"},
        updatedAt: { $first: "$learning_master_details.updatedAt" }
      }
    },
    { $sort : { updatedAt : -1} }
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
        title: "Learning Data by Reviewer",
        result: {
          message: data
        }
      });
    }
  });

}

function getLearningApproval(req, res) {

  let learningMasterId = parseInt(req.body.learningMasterId);
  let learningDetailId = parseInt(req.body.learningDetailId);
  let empId = parseInt(req.body.empId);
  let supervisorId = parseInt(req.body.supervisorId);
  let eligibleForEmail = false;
  let email_details = {
    user_email: '',
    supervisor_name: req.body.supervisor_name,
    user_name: '',
    action_link: req.body.action_link,
    isApproved: req.body.isApproved ? "Approved" : "SendBack"
  };
  let isLearningApproved = false;
  async.waterfall(
    [
      done => {
        let masterUpdateQuery = {
          updatedBy: supervisorId,
          updatedAt: new Date(),
          status: req.body.isApproved ? "Approved" : "SendBack"
        };
        LearningDetails.find({ master_id: learningMasterId }, (err, res) => {
          if (err)
            done(err, null);
          let pendingLearning = res.filter(learning => {
            return (!learning.status || learning.status == "Submitted");
          });
          if (pendingLearning.length <= 1 && pendingLearning[0]._id == learningDetailId) {
            isLearningApproved = true;
            eligibleForEmail =true;
            let sendbackLearning = res.filter(learning => {
              return (learning.status == "SendBack");
            });
            if (sendbackLearning && sendbackLearning.length > 0) {
              masterUpdateQuery.status = "SendBack";
              isLearningApproved = false;
              eligibleForEmail = true;
            }
            LearningMaster.findByIdAndUpdate({ _id: learningMasterId }, masterUpdateQuery, (err, res) => {
              done(err, res);
            });
          } else {
            done(null, null);
          }
        });
      },
      (learningMasterResponse, done) => {
        let learningDetailUpdateQuery = {
          supervisorComment: req.body.supervisorComment,
          updatedBy: parseInt(req.body.supervisorId),
          updatedAt: new Date(),
          status: req.body.isApproved ? "Approved" : "SendBack"
        };
        if (req.body.isApproved && req.body.progressStatus == "Dropped") {
          learningDetailUpdateQuery.status = "Dropped";
        }
        LearningDetails.findOneAndUpdate({ _id: learningDetailId }, learningDetailUpdateQuery, (err, res) => {
          done(err, res);
        });
      },
      // (resp, done) => {
      //   if (req.body.isApproved != true) {
      //     let mtrDetailUpdateQuery = {
      //       updatedBy: parseInt(req.body.supervisorId),
      //       updatedAt: new Date(),
      //       status: "SendBack"
      //     };
      //     MidTermDetails.updateMany({ mtr_master_id: mtrMasterId }, mtrDetailUpdateQuery, (err, res) => {
      //       done(err, res);
      //     });
      //   } else {
      //     done(null, null);
      //   }
      // },
      (response2, done) => {
        // for email details
        EmployeeDetails.aggregate(
          [
            {
              "$lookup": {
                "from": "employeeofficedetails",
                "localField": "_id",
                "foreignField": "emp_id",
                "as": "office_details"
              }
            },
            {
              "$unwind": {
                "path": "$office_details"
              }
            },
            {
              "$match": {
                "_id": empId
              }
            },
            {
              "$project": {
                "_id": "$_id",
                "user_name": "$fullName",
                "officeEmail": "$office_details.officeEmail"
              }
            }
          ]).then((doc, err) => {
            let finalData = { learningmaster: response2, emp: doc }
            done(err, finalData);
          });
      }
    ],
    (err, result) => {
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
        // #70 fix, email fix
        if (eligibleForEmail) {
          email_details.user_name = result.emp[0].user_name;
          email_details.user_email = result.emp[0].officeEmail;
          if (email_details.user_email) {
            SendEmail.sendEmailToUserAboutLearningStatus(email_details, (email_err, email_result) => {
              if (email_err) {
                return res.status(300).json({
                  title: "Learning agenda approved, failed sending email to employee",
                  error: {
                    message: "Learning agenda approved, failed sending email to employee"
                  },
                  result: {
                    message: email_result
                  }
                });
              } else {
                return res.status(200).json({
                  title: "Learning agenda approved, and email sent to employee",
                  result: {
                    message: email_result
                  }
                });
              }
            });
          } else {
            return res.status(300).json({
              title: "Learning agenda approved, failed sending email to employee",
              error: {
                message: "Learning agenda approved, failed sending email to employee"
              },
              result: {
                message: result
              }
            });
          }
        } else {
          return res.status(200).json({
            title: "Learning agenda submitted",
            result: {
              message: result
            }
          });
        }
      }
    }
  );
}

function updateBatch(req, res) {

  let batchId = parseInt(req.body.batchId);

  let updateQuery = {
    "updatedAt": new Date(),
    "updatedBy": parseInt(req.body.updatedBy),
    "batchEndDate": req.body.batchEndDate
  };

  LearningBatch.findOneAndUpdate({ _id: batchId }, updateQuery, (err, result) => {
    if (err) {
      return res.status(403).json({
        title: "There was a problem",
        error: {
          message: err
        },
        result: {
          message: result
        }
      });
    } else {
      AuditTrail.auditTrailEntry(
        0,
        "LearningBatch",
        result,
        "learning",
        "updateBatch",
        "UPDATED"
      );
      return res.status(200).json({
        title: "Learning batch updated",
        result: {
          message: result
        }
      });
    }
  });
}

function getLearningBatch(req, res) {

  let currentUserId = parseInt(req.query.empId);
  LearningBatch.aggregate([
    {
      $match: {
        createdBy: currentUserId
      }
    },
    {
      $lookup: {
        from: "learningmasters",
        localField: "_id",
        foreignField: "batch_id",
        as: "learning_master"
      }
    },
    {
      $unwind: {
        path: "$learning_master",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "employeedetails",
        localField: "learning_master.emp_id",
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
      $lookup: {
        from: "grades",
        localField: "emp_details.grade_id",
        foreignField: "_id",
        as: "emp_grade_details"
      }
    },
    {
      $unwind: {
        path: "$emp_grade_details",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "employeeofficedetails",
        localField: "emp_details._id",
        foreignField: "emp_id",
        as: "emp_office_details"
      }
    },
    {
      $unwind: {
        path: "$emp_office_details",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "departments",
        localField: "emp_office_details.department_id",
        foreignField: "_id",
        as: "emp_dept_details"
      }
    },
    {
      $unwind: {
        path: "$emp_dept_details",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 1,
        updatedAt: 1,
        createdAt: -1,
        isDeleted: 1,
        status: 1,
        updatedBy: 1,
        createdBy: 1,
        batchEndDate: 1,
        batchName: 1,
        learning_master: {
          _id: 1,
          updatedAt: 1,
          createdAt: 1,
          batch_id: 1,
          emp_id: 1,
          isDeleted: 1,
          createdBy: 1,
          updatedBy: 1,
          status: 1,
          emp_details: "$emp_details",
          emp_grade_details: "$emp_grade_details",
          emp_dept_details: "$emp_dept_details"
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
        learning_master: { $push: "$learning_master" }
      }
    },
    { $sort : { createdAt : 1} }
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
        title: "Learning master data",
        result: {
          message: data
        }
      });
    }
  });
}

let functions = {
    initiateLearningProcess: (req, res) => {
    InitiateLearning(req, res);
    },

    getLearningForSingleEmployee: (req, res) => {
      GetLearningSingleEmployee(req, res);
    },

    postNewLearning: (req, res) => {
      InsertLearning(req, res);
    },

    getLearningDetailsSingleEmployee: (req, res) => {
      GetLearningDetailsEmployee(req, res);
    },

    getLearningForSuperviser: (req, res) => {
      getLearningBySupervisor(req, res);                  
    },

    submitLearning: (req, res) => {
      submitEmployeeLearning(req, res);
    },

    learningByReviewer: (req, res) => {
      getLearningByReviewer(req, res);
    },

    learningApproval: (req, res) => {
      getLearningApproval(req, res);
    },

    updateBatch: (req, res) => {
      updateBatch(req, res);
    },

    getLearningBatch: (req, res) => {
      getLearningBatch(req, res);
    }

};

module.exports = functions;