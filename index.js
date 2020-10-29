var http = require('http')

const host = '127.0.0.1'
const port = 9090

http.createServer(function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'})
  res.end('Hello world')
}).listen(port, host)

console.log(`Server running at http://${host}:${port}`)
