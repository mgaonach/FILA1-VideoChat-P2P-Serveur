var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var p2p = require('socket.io-p2p-server').Server;

var guestsCount = 1;
const MAX_USERS_PER_ROOM = 3;


io.on('connection', function(socket) {
    socket.username = 'guest' + guestsCount++;
    socket.currentRoom = '';
    socket.sdp = null;

    socket.join(socket.currentRoom);
    console.log(socket.username + ' entered the lobby');
    
    socket.emit('connection established');
    socket.on('set sdp', function(sdp) {
        socket.sdp = {username: socket.username};
    });

    socket.on('set username', function(newName) {
        if ( newName === '' ) {
            newName = 'Someone';
        }

        const previousName = socket.username;

        if ( newName !== previousName ) {
            socket.username = newName;
            socket.sdp = {username: socket.username};
            socket.broadcast.to(socket.currentRoom).emit('username set', previousName, newName);
        }

        console.log(previousName + ' is now ' + newName);
    });

    socket.on('join room', function(newRoom) {
        // Si le salon est vide, l'utilisateur quitte son salon
        if ( newRoom === '' ) {
            leaveRoom();
        } 
        // Sinon, et si le salon a changé, l'utilisateur est déplacé dans le nouveau salon
        else if (newRoom !== socket.currentRoom) {
            io.of('/').in(newRoom).clients((error, clients) => {
                let usersCount = clients.length;
    
                // @refactor Vérification asynchrone
                if ( usersCount >= MAX_USERS_PER_ROOM ) {
                    socket.emit('room full');
                } else {
                    if ( usersCount !== 0 ) {
                        io.in(newRoom).clients((error, clients) => {
                            if (error) throw error;

                            clients.forEach((client) => {
                                const peerSocket = io.of('/').connected[client];
                                const peerSdp = peerSocket.sdp;
    
                                socket.emit('offer recieved', peerSdp);
                            });

                          });
                    }
                    joinRoom(newRoom);
                    socket.broadcast.to(newRoom).emit('offer recieved', socket.sdp);

                    console.log(socket.username + ' joined the room "' + newRoom + '"');
                }
            });
        }
    });

    socket.on('leave room', function() {
        leaveRoom();
    });

    socket.on('send offer', function(sdp) {
        if ( sdp != null ) {
            socket.broadcast.to(socket.currentRoom).emit('offer recieved', sdp);

            console.log(socket.username + ' has sent an offer to the room "' + socket.currentRoom + '"');
        }
    });

    socket.on('disconnect', function() {
    });


    /**
     * Permet de quitter le salon en cours
     */
    function leaveRoom(){
        socket.broadcast.to(socket.currentRoom).emit('peer left');

        socket.leave(socket.currentRoom);
        console.log(socket.username + ' left the room "' + socket.currentRoom + '"');
        socket.currentRoom = '';
    }

    /**
     * Permet de rejoindre un salon
     */
    function joinRoom(newRoom){
        leaveRoom();
        socket.join(newRoom);
        socket.currentRoom = newRoom;
    }
});

http.listen(2019, function() {
    console.log('listening on *:2019');
});

