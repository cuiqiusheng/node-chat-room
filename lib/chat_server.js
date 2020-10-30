const socketio = require('socket.io')

let io
let gusetNumber = 1
let nickNames = {}
let namesUsed = []
let currentRoom = {}

function assignGuestName(socket, gusetNumber, nickNames, namesUsed) {
  const name = `Guest${gusetNumber}`
  nickNames[socket.id] = name
  socket.emit('nameResult', {
    success: true,
    name,
  })
  namesUsed.push(name)
  
  return gusetNumber + 1
}

function joinRoom(socket, room) {
  socket.join(room)
  currentRoom[socket.id] = room
  socket.emit('joinResult', { room })
  socket.broadcast.to(room).emit('message', {
    text: `${nickNames[socket.id]} has joined ${room}.`,
  })

  // let usersInRoom = Object.keys(io.sockets.sockets)

  io.in(room).clients((err, usersInRoom) => {
    if (usersInRoom.length > 1) {
      let usersInRoomSummary = `Users currently in ${room}: `
      for (let i = 0; i < usersInRoom.length; i++) {
        const userSocketId = usersInRoom[i]
        if (userSocketId !== socket.id) {
          if (i > 0) {
            usersInRoomSummary += ', '
          }
          usersInRoomSummary += nickNames[userSocketId]
        }
      }
      usersInRoomSummary += '.'
      socket.emit('message', { text: usersInRoomSummary })
    }
  })
}

function handleNameChangeAttempts(socket, nickNames, namesUsed) {
  socket.on('nameAttempt', function(name) {
    if (name.indexOf('Guest') === 0) {
      socket.emit('nameResult', {
        success: false,
        message: 'Names connot begin with "Guest".',
      })
    } else {
      if (namesUsed.indexOf(name) === -1) {
        let previousName = nickNames[socket.id]
        let previousNameIndex = namesUsed.indexOf(previousName)
        namesUsed.push(name)
        nickNames[socket.id] = name
        delete namesUsed[previousNameIndex]
        socket.emit('nameResult', {
          success: true,
          name,
        })
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
          text: `${previousName} is now known as ${name}.`,
        })
      } else {
        socket.emit('nameResult', {
          success: false,
          message: 'That name is already in use.'
        })
      }
    }
  })
}

function handleMessageBroadcasting(socket) {
  socket.on('message', function(message) {
    socket.broadcast.to(message.room).emit('message', {
      text: `${nickNames[socket.id]}: ${message.text}`,
    })
  })
}

function handleRoomJoining(socket) {
  socket.on('join', function(room) {
    socket.leave(currentRoom[socket.id])
    joinRoom(socket, room.newRoom)
  })
}

function handleClientDisconnection(socket) {
  socket.on('disconnect', function() {
    let nameIndex = namesUsed.indexOf(nickNames[socket.id])
    delete namesUsed[nameIndex]
    delete nickNames[socket.id]
  })
}

exports.listen = function(server) {
  io = socketio.listen(server)
  io.set('log level', 1)
  io.sockets.on('connection', function(socket) {
    gusetNumber = assignGuestName(socket, gusetNumber, nickNames, namesUsed)
    joinRoom(socket, 'Lobby')
    handleMessageBroadcasting(socket, nickNames)
    handleNameChangeAttempts(socket, nickNames, namesUsed)
    handleRoomJoining(socket)

    socket.on('rooms', function() {
      socket.emit('rooms', io.sockets.adapter.rooms)
    })

    handleClientDisconnection(socket, nickNames, namesUsed)
  })
}