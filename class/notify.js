let express       = require('express'),
    Notify        = require('../models/common/notification.model');
    io = require('socket.io');


let functions = {
  initialize: (server) =>
  {
    io = io.listen(server);
    io.on("connection", function(socket){
        // socket.on('initData', function(data) {
        //   socket.emit('getData', 'Return form server');
        // });
        //console.log('a user connected');
        socket.on('disconnect', () => {
          //console.log('user disconnected');
        });
    });
  },

  getNotificaton:(id)=>
  {
    // Notify.find({id:id})
    // limit(10).
    // sort({ createdAt: -1 }).exec();
    // io.emit('getData', 'Return form server');
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