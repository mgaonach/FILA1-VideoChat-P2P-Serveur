let isInitiator;

room = prompt('Enter room name:');

const socket = io.connect('http://172.17.3.116:2013');

if (room !== '') {
  console.log('Joining room ' + room);
  socket.emit('join', room);
}

const inputField = document.querySelector('input');
const outputField = document.querySelector('ul');

document.querySelector('#input').addEventListener('submit', function(e) {
  e.preventDefault();

  const message = inputField.value;
  inputField.value = '';
  inputField.focus();

  socket.emit('chat message', message);
});

socket.on('recieve_message', (message) => {
  alert("ok");
  const li = document.createElement('li');
  li.appendChild(document.createTextNode(message));
  outputField.appendChild(li);
})

socket.on('full', (room) => {
  alert('Room ' + room + ' is full');
});

socket.on('empty', (room) => {
  isInitiator = true;
  alert('Room ' + room + ' is empty');
});

socket.on('join', (room) => {
  alert('Making request to join room ' + room);
  console.log('You are the initiator!');
});

socket.on('log', (array) => {
  console.log.apply(console, array);
});

