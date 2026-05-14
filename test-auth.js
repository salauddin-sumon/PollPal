// Simple connection test
const net = require('net');

const client = net.createConnection({ port: 3000, host: 'localhost' }, () => {
  console.log('Connected to server!');
  client.write('GET / HTTP/1.1\r\nHost: localhost\r\n\r\n');
});

client.on('data', (data) => {
  console.log('Received:', data.toString());
  client.end();
});

client.on('error', (err) => {
  console.error('Connection error:', err.message);
});

client.on('end', () => {
  console.log('Connection closed');
});