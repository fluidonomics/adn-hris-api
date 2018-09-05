let cron = require('node-cron'),
    LeaveApply = require('../models/leave/leaveApply.model');

module.exports =  (crontab) = {
    autoApproveLeave: () => {
        cron.schedule('1 0 * * *', function() {
            let days = 3; // Days you want to subtract
            let todayDate = new Date();
            let lastDate = new Date(todayDate.getTime() - (days * 24 * 60 * 60 * 1000));
            let startDate = new Date(lastDate.setHours(0,0,0,0));
            let endDate = new Date(lastDate.setHours(23,59,59,999));
            let query ={
                createdAt: { 
                    $lte : endDate,
                    $gte : startDate
                }, 
                status: "Applied",
                isDeleted: false,
            }
        
            LeaveApply.find(query, function (err, leaves) {
                if (err) {
                    return res.status(403).json({
                        title: "ERROR",
                        error: {
                            message: err
                        },
                    });
                }
                leaves.forEach(function (leave) {
                    if (leave.status === "Applied") {
                        LeaveApply.update({ _id: leave._id}, { $set: { status: "Approved", systemApproved: true}}, function(err, changedLeave) {
                        });
                    }
                });
            });
        });
    }
}


