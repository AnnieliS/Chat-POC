const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');

const { addUser, removeUser, getUser, getUsersInRoom} = require('./users');

const PORT = process.env.PORT || 5000;

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(cors());
app.use(router);


io.on('connect', (socket) => {
console.log('new connection');

socket.on('joinRoom', ({id, name}, callback) => {
    const { error, user } = addUser({id: socket.id , name, id});
    console.log(user)
    if(error) return callback(error);

    socket.join(user.id);

    socket.emit('message', {user: 'admin', text: `${user.name} , welcome to the game`});
    socket.broadcast.to(user.room).emit('message', {user: 'admin', text: `${user.name} has joined the room`});

    io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom})

    callback();
});

socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);
    
    io.to(user.room).emit('message', {user: user.name, text: message});

    callback;

});

socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if(user){
        io.to(user.room).emit('message', {user:'admin', text:`${user.name} has left.`})
    }
    })
});



server.listen(PORT, () => console.log(`server has started on port ${PORT}`));
