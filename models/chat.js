//// File description: handles chat logic for backend
/// UNUSED

// var socketIO = require('socket.io');
// const socket = io();

// var chat_form = document.getElementById('chat-input-form');

// socket.on('welcome-message')


function handleMessage(message){
    console.log("handleMessage:" + message);
    socket.emit('incoming-message', message);
};

// console.log("chat.js here!")

module.exports = {
    handleMessage
}