const static = require('node-static');
const http = require('http');
const file = new(static.Server)();
const app = http.createServer(function (req, res) {
  file.serve(req, res);
}).listen(2013);

const io = require('socket.io').listen(app);

io.sockets.on('connection', (socket) => {

  // convenience function to log server messages to the client
  function log(){
    const array = ['>>> Message from server: '];
    for (let i = 0; i < arguments.length; i++) {
      array.push(arguments[i]);
    }
      socket.emit('log', array);
  }

  socket.on('send_message', message => {
    console.log(message);
    socket.broadcast.emit('recieve_message', message);
  });

  socket.on('join', (room) => {
    const numClients = io.of('/').in(room).clients.length;

    log('Room ' + room + ' has ' + numClients + ' client(s)');
    log('Request to create or join room ' + room);

    if (numClients === 0){
      socket.join(room);
      socket.emit('created', room);
    } else if (numClients === 1) {
      io.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room);
    } else { // max two clients
      socket.emit('full', room);
    }
    socket.emit('emit(): client ' + socket.id +
      ' joined room ' + room);
    socket.broadcast.emit('broadcast(): client ' + socket.id +
      ' joined room ' + room);

  });

});

