let express       = require('express'),
    Notify        = require('../models/common/notification.model');
    io = require('socket.io');

  function fnSendNotifications(notificationFlag,emp, title, message, senderEmp_id, recipientEmp_id, type_id, linkUrl,createdBy)
  {
    let notification = new Notify();
    notification.emp_id = emp._id;
    notification.title = title;
    notification.message = message;
    notification.linkUrl = linkUrl;
    notification.senderEmp_id = 1;
    notification.recipientEmp_id = recipientEmp_id;
    notification.type_id = type_id;
    notification.createdBy = createdBy;
    notification.save(function(err, result) {
        if (result) {
            //Send Bussiness Hr Head
            if (notificationFlag == 0) {
                sendNotifications(notificationFlag++,emp, title, message, senderEmp_id, emp.businessHrHead_id, type_id, linkUrl);
            } else if (notificationFlag == 1) {
                sendNotifications(notificationFlag++,emp, title, message, senderEmp_id, emp.groupHrHead_id, type_id, linkUrl);
            } else if (notificationFlag == 2) {
                sendNotifications(notificationFlag++,emp, title, message, senderEmp_id, emp.groupHrHead_id, type_id, linkUrl);
            } else {
                return res.status(200).json({
                    message: "Success"
                });
            }
        } else {
            return res.status(403).json({
                title: 'There was a problem',
                error: {
                    message: err
                },
                result: {
                    message: result
                }
            });
        }
    });
  }

let functions = {
  initialize: (server) =>
  {
    io = io.listen(server);
    io.on("connection", function(socket){
        socket.on('initData', function(data) {
          socket.emit('getData', 'Return form server');
        });
        console.log('a user connected');
        socket.on('disconnect', () => {
          //console.log('user disconnected');
        });
    });
  },

  getNotificaton:(id)=>
  {
    io.emit('sendBack',"send notification");
    // Notify.find({id:id})
    // limit(10).
    // sort({ createdAt: -1 }).exec();
    // io.emit('getData', 'Return form server');
  },

  sendNotifications:(emp, title, message, senderEmp_id, recipientEmp_id, type_id, linkUrl,createdBy)=>
  {
    fnSendNotifications(0, emp, title, message, senderEmp_id, recipientEmp_id, type_id, linkUrl,createdBy)
  }
};

// initialize = function(server) {
// io = io.listen(server);
// io.sockets.on("connection", function(socket){
//   socket.on('initData', function(data) {
//     socket.emit('getData', ' Return form server');
//   }); 
// });
// }

// let functions={

// }

 module.exports = functions;