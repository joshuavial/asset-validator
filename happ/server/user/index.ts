import server from './server'

const PORT = process.env.USER_SERVER_PORT || 5000

server.listen(PORT, '0.0.0.0', () => {
  console.log('http://127.0.0.1:' + PORT)
})
