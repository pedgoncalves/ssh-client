import { createServer } from 'node:http'
import next from 'next'
import { WebSocketServer, type WebSocket } from 'ws'
import { Client, type ClientChannel } from 'ssh2'
import { connectionSchema } from './lib/ssh-validation'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME ?? '0.0.0.0'
const port = Number(process.env.PORT ?? 3000)
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

function send(socket: WebSocket, payload: string) {
  if (socket.readyState === socket.OPEN) socket.send(payload)
}

app.prepare().then(() => {
  const httpServer = createServer((request, response) => handle(request, response))
  const wss = new WebSocketServer({ server: httpServer, path: '/ssh' })

  wss.on('connection', (socket) => {
    const ssh = new Client()
    let shell: ClientChannel | undefined

    socket.on('message', (raw) => {
      try {
        const message = JSON.parse(raw.toString()) as { type: string; data?: unknown }
        if (message.type === 'connect') {
          const parsed = connectionSchema.safeParse(message.data)
          if (!parsed.success) {
            send(socket, `\r\n[erro] Dados de conexão inválidos: ${parsed.error.issues[0]?.message ?? 'verifique os campos'}\r\n`)
            return
          }
          const { host, port, username, password, privateKey, passphrase } = parsed.data
          ssh.once('ready', () => {
            send(socket, '\r\n[ok] Conexão SSH estabelecida.\r\n')
            ssh.shell({ term: 'xterm-256color', cols: 120, rows: 32 }, (error, stream) => {
              if (error) { send(socket, `\r\n[erro] Não foi possível abrir o shell: ${error.message}\r\n`); return }
              shell = stream
              stream.on('data', (data: Buffer) => send(socket, data.toString()))
              stream.stderr.on('data', (data: Buffer) => send(socket, data.toString()))
              stream.on('close', () => { send(socket, '\r\n[sessão encerrada]\r\n'); ssh.end() })
            })
          }).on('error', (error) => send(socket, `\r\n[erro] Falha SSH: ${error.message}\r\n`))
          ssh.connect({ host, port, username, password, privateKey, passphrase, readyTimeout: 15000 })
        }
        if (message.type === 'input' && typeof message.data === 'string') shell?.write(message.data)
        if (message.type === 'resize' && shell && typeof message.data === 'object' && message.data) {
          const size = message.data as { cols?: number; rows?: number }
          shell.setWindow(size.rows ?? 32, size.cols ?? 120, 0, 0)
        }
      } catch {
        send(socket, '\r\n[erro] Mensagem inválida.\r\n')
      }
    })
    socket.on('close', () => { shell?.close(); ssh.end() })
  })

  httpServer.listen(port, hostname, () => console.log(`SSH Studio em http://${hostname}:${port}`))
})
