const socket = io.connect()

function scrollToTop() {
  $('#messages').scrollTop($('#messages').prop('scrollHeight'))
}

function divEscapedContentElement(message) {
  return $('<div style="border-bottom: 1px dashed #666; margin: 4px 0;"></div>').text(message)
}

function divSystemContentElement(message) {
  return $('<div style="border-bottom: 1px dashed #666; margin: 4px 0; color: #666;"></div>').html(`<i>${message}</i>`)
}

function processUserInput(chatApp, socket) {
  let message = $('#send-message').val()
  if (!message.trim()) {
    return
  }
  let systemMessage

  if (message.charAt(0) === '/') {
    systemMessage = chatApp.processCommand(message)
    if (systemMessage) {
      $('#messages').append(divSystemContentElement(message))
    }
  } else {
    chatApp.sendMessage($('#room').text(), message)
    $('#messages').append(divEscapedContentElement(`you: ${message}`))
    scrollToTop()
  }
  $('#send-message').val('')
}

$(document).ready(function() {
  const chatApp = new Chat(socket)

  socket.on('nameResult', function(result) {
    let message

    if (result.success) {
      message = `You are now known as ${result.name}.`
    } else {
      message = result.message
    }
    $('#messages').append(divSystemContentElement(message))
    scrollToTop()
  })

  socket.on('joinResult', function(result) {
    $('#room').text(result.room)
    $('#messages').append(divSystemContentElement('Room changed.'))
    scrollToTop()
  })

  socket.on('message', function(message) {
    let newElement = $('<div style="border-bottom: 1px dashed #666; margin: 4px 0;"></div>').text(message.text)
    $('#messages').append(newElement)
    scrollToTop()
  })

  socket.on('rooms', function(rooms) {
    $('#room-list').empty()

    for (var room in rooms) {
      room = room.substring(0, room.length)
      if (room !== '') {
        $('#room-list').append(divEscapedContentElement(room))
      }
    }

    $('#room-list div').click(function() {
      chatApp.processCommand(`/join ${$(this).text()}`)
      $('#send-message').focus()
    })
  })

  setInterval(function() {
    socket.emit('rooms')
  }, 1000)

  $('#send-message').focus()

  $('#send-form').submit(function() {
    processUserInput(chatApp, socket)
    return false
  })
})
