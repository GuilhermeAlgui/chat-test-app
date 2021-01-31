const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');

const {
	getUser,
	getUsersInRoom,
	addUser,
	removeUser,
} = require('./utils/users');

const {
	generateMessage,
	generateLocationMessage,
} = require('./utils/messages');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3333;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
	console.log('New Websocket connection');

	socket.on('join', ({ username, room }, callback) => {
		const { error, user } = addUser({ id: socket.id, username, room });

		if (error) {
			return callback(error);
		}

		socket.join(user.room);

		socket.emit('message', generateMessage('Admin','Welcome!'));
		socket.broadcast
			.to(user.room)
			.emit('message', generateMessage('Admin',`${user.username} has joined`));

		io.to(user.room).emit('roomData',{
			room: user.room,
			users: getUsersInRoom(user.room)
		})	
		callback();
	});

	socket.on('sendMessage', (message, callback) => {
		const { username,room } = getUser(socket.id);

		if (!room) {
			return callback('Room not found');
		}

		const filter = new Filter();

		if (filter.isProfane(message)) {
			return callback('Profanity is not allowed');
		}

		io.to(room).emit('message', generateMessage(username,message));
		callback();
	});

	socket.on('sendLocation', (coords, callback) => {
		const user = getUser(socket.id);

		if (!user) {
			return callback('Room not found');
		}
		const username = user.username
		console.log(username)

		io.to(user.room).emit(
			'locationMessage',
			generateLocationMessage(username,
				`https://google.com/maps?q=${coords.latitude},${coords.longitude}`
			)
		);

		callback();
	});

	socket.on('disconnect', () => {
		const user = removeUser(socket.id);

		if (user) {
			io.to(user.room).emit(
				'message',
				generateMessage('Admin',`${user.username} has left`)
			);

			io.to(user.room).emit('roomData',{
				room: user.room,
				users: getUsersInRoom(user.room)
			})
		}
	});
});

server.listen(port, () => {
	console.log(`Server is up on port ${port}`);
});
