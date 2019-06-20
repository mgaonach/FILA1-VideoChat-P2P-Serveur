var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var p2p = require('socket.io-p2p-server').Server;

var guestsCount = 1;
const MAX_USERS_PER_ROOM = 2;


io.on('connection', function(socket) {
    socket.username = 'guest' + guestsCount++;
    socket.currentRoom = '';
    socket.sdp = null;

    socket.join(socket.currentRoom);
    console.log(socket.username + ' entered the lobby');
    
    // On informe le client que la connexion est établie, et on lui donne son nom d'utilisateur par défaut
    socket.emit('connection established', socket.username);

    socket.on('set sdp', (sdp, respond) => {
        if ( sdp == null ) {
            respond({error: true});
        } else {
            socket.sdp = sdp;

            io.of('/').in(socket.currentRoom).clients((error, clients) => {
                let usersCount = clients.length;
    
                if ( usersCount !== 0 ) {
                    io.in(socket.currentRoom).clients((error, clients) => {
                        if (error) respond({error: true});

                        clients.forEach((client) => {
                                const peerSocket = io.of('/').connected[client];

                                if ( socket !== peerSocket ) {
                                    const peerSdp = peerSocket.sdp;
                                    const peerUsername = peerSocket.username;
        
                                    socket.emit('offer received', peerSdp, peerUsername);
                                }
                        });
                    });
                }
                socket.broadcast.to(socket.currentRoom).emit('offer received', socket.sdp, socket.username);
            });

            respond({message: 'SDP updated'});
            console.log(socket.username + " has now an SDP");
        }
    });

    socket.on('set username', function(newName, respond) {
        const previousName = socket.username;

        if ( newName == null || newName === '' ) {
            respond({error: true});
        } else if ( newName === previousName ) {
            respond({error: true});
        } else {
            socket.username = newName;
            if ( socket.currentRoom != null && socket.currentRoom !== '') {
                socket.broadcast.to(socket.currentRoom).emit('username set', previousName, newName);
            }
            respond();
            console.log(previousName + ' is now ' + newName);
        }
    });

    socket.on('leave room', (respond) => {
        if ( socket.currentRoom !== '' ) {
            leaveRoom();
        }
    });

    socket.on('join room', (newRoom, respond) => {
        if (newRoom == null || newRoom === '') {
            respond({error: true})
        } else if (newRoom !== socket.currentRoom) {
            io.of('/').in(newRoom).clients((error, clients) => {
                let usersCount = clients.length;
    
                if ( usersCount >= MAX_USERS_PER_ROOM ) {
                    socket.emit('room full');
                    respond({error: true});
                } else {
                    joinRoom(newRoom);

                    respond({message: ''});

                    console.log(socket.username + ' joined the room "' + newRoom + '"');
                }
            });
        } else {
            respond({error: true});
        }
    });

    socket.on('send offer', function(sdp) {
        if ( sdp != null ) {
            socket.broadcast.to(socket.currentRoom).emit('offer received', sdp);

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
        if ( socket.currentRoom != null && socket.currentRoom !== '' ) {
            leaveRoom();
        }
        socket.join(newRoom);
        socket.currentRoom = newRoom;
    }
});

http.listen(2019, function() {
    console.log('listening on *:2019');
});

