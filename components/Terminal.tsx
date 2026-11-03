'use client'

import { useEffect, useRef } from 'react'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal as XTerm } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'

type TerminalProps = {
  socketUrl?: string
  onStatusChange?: (status: 'connecting' | 'connected' | 'closed' | 'error') => void
}

export function Terminal({ socketUrl, onStatusChange }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const terminalRef = useRef<XTerm | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const terminal = new XTerm({
      cursorBlink: true,
      fontFamily: 'JetBrains Mono, SFMono-Regular, Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.45,
      theme: {
        background: '#0b1018',
        foreground: '#d3dae6',
        cursor: '#72e0a3',
        selectionBackground: '#28445b',
        black: '#0b1018',
        green: '#72e0a3',
        brightGreen: '#9df2c1',
        cyan: '#7dd3fc',
        brightCyan: '#a5f3fc',
      },
      convertEol: true,
      scrollback: 3000,
    })
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.open(containerRef.current)
    fitAddon.fit()
    terminalRef.current = terminal

    const resize = () => {
      fitAddon.fit()
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'resize', cols: terminal.cols, rows: terminal.rows }))
      }
    }
    window.addEventListener('resize', resize)

    if (socketUrl) {
      onStatusChange?.('connecting')
      const socket = new WebSocket(socketUrl)
      socketRef.current = socket
      socket.onopen = () => onStatusChange?.('connected')
      socket.onmessage = (event) => terminal.write(typeof event.data === 'string' ? event.data : '')
      socket.onerror = () => onStatusChange?.('error')
      socket.onclose = () => onStatusChange?.('closed')
      terminal.onData((data) => {
        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'input', data }))
      })
    } else {
      terminal.write('\x1b[38;5;111mSSH Studio\x1b[0m  •  terminal pronto\r\n')
      terminal.write('\x1b[38;5;145mConecte-se a um servidor para iniciar uma sessão.\x1b[0m\r\n\r\n')
      terminal.write('\x1b[38;5;145m$ \x1b[0m')
    }

    return () => {
      window.removeEventListener('resize', resize)
      socketRef.current?.close()
      terminal.dispose()
      terminalRef.current = null
    }
  }, [socketUrl, onStatusChange])

  return <div ref={containerRef} className="h-full w-full" aria-label="Terminal SSH interativo" />
}
