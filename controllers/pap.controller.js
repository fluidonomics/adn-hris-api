let async = require('async'),

    AuditTrail = require('../class/auditTrail');

require('dotenv').load();


function getEmployeesForPapInitiate(req, res, done) {

}


let functions = {
    getEmployeesForPapInitiate: (req, res) => {
        async.waterfall([
            function (done) {
                getEmployeesForPapInitiate(req, res, done);
            },
            function (papData, done) {
                return res.status(200).json(papData);
            }
        ]);
    }
}

module.exports = functions;