const sdp = {ip: "192.168.X.X"};
var socket = io("http://localhost:2019/");

socket.on('connection established', function() {
    socket.emit('set sdp', sdp);
});

/**
 * Changement de nom d'utilisateur
 */
$('#username').submit(function(e) {
    e.preventDefault();

    const username = $(this).find('input').val();

    socket.emit('set username', username);

    return false;
});

/**
 * Connexion à un salon
 */
$('#room').submit(function(e) {
    e.preventDefault();

    const room = $(this).find('input').val();

    socket.emit('join room', room);

    return false;
});

$('#leave').on('click', () => {
    const room = $('#room').find('input').val();
    socket.emit('leave room', room);
});

/**
 * Réaction au changement de nom d'utilisateur de quelqu'un d'autre
 */
socket.on('username set', function(previousName, newName) {
    alert(previousName + ' is now ' + newName);
});

socket.on('room joined', function(){

});

/**
 * Réaction en cas d'échec de changement de salon (salon plein)
 */
socket.on('room full', function(msg) {
});

/**
 * Réaction quand une offre de connexion P2P
 */
socket.on('offer recieved', function(sdp) {
    alert(JSON.stringify(sdp));
})

/**
 * Réaction quand un client quitte le salon
 */
socket.on('peer left', function() {
});

