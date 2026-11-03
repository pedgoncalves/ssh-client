# Referência de Código e Módulos

Este documento descreve detalhadamente cada arquivo de código-fonte do projeto **SSH Studio**, suas responsabilidades, assinaturas e pontos técnicos de atenção observados na implementação atual.

---

## 1. Backend e Servidor Customizado

### `server.ts`
Arquivo de entrada do servidor Node.js que unifica o handler do Next.js e o servidor WebSocket para sessões SSH.

- **Inicialização do Next.js:**
  - Detecta o ambiente (`dev = process.env.NODE_ENV !== 'production'`).
  - Define `hostname` (`process.env.HOSTNAME ?? '0.0.0.0'`) e `port` (`Number(process.env.PORT ?? 3000)`).
  - Cria o servidor HTTP nativo (`createServer`) repassando todas as requisições HTTP padrão para `app.getRequestHandler()`.
- **Servidor WebSocket (`WebSocketServer`):**
  - Acoplado ao mesmo `httpServer` no caminho `/ssh`.
  - Para cada conexão WebSocket aberta, instancia um novo `Client` da biblioteca `ssh2` e mantém a referência do canal `shell` (`ClientChannel | undefined`).
- **Função auxiliar `send(socket, payload)`:**
  - Verifica se `socket.readyState === socket.OPEN` antes de transmitir dados ao navegador.
- **Ciclo de Vida da Conexão SSH:**
  - Ao receber `{ type: 'connect', data }`, valida `data` com `connectionSchema.safeParse`.
  - Configura timeout de conexão de 15 segundos (`readyTimeout: 15000`).
  - No evento `ready`, abre um shell interativo com `{ term: 'xterm-256color', cols: 120, rows: 32 }`.
  - Encaminha `stream.on('data')` e `stream.stderr.on('data')` diretamente ao WebSocket.
  - Encerra a sessão SSH (`ssh.end()` e `shell?.close()`) quando o stream fecha ou quando o WebSocket do cliente é desconectado.

---

### `lib/ssh-validation.ts`
Define o schema de validação **Zod** e o tipo TypeScript correspondente para os parâmetros de conexão SSH.

```ts
export const connectionSchema = z.object({
  host: z.string().trim().min(1, 'Informe o host').max(255),
  port: z.coerce.number().int().min(1).max(65535),
  username: z.string().trim().min(1, 'Informe o usuário').max(128),
  password: z.string().max(4096).optional(),
  privateKey: z.string().max(200000).optional(),
  passphrase: z.string().max(4096).optional(),
})

export type ConnectionInput = z.infer<typeof connectionSchema>
```

**Regras de validação:**
- `host`: String obrigatória (após `trim`), entre 1 e 255 caracteres.
- `port`: Convertido automaticamente para número (`z.coerce.number()`), inteiro entre `1` e `65535`.
- `username`: String obrigatória (após `trim`), entre 1 e 128 caracteres.
- `password`: Opcional, até 4.096 caracteres.
- `privateKey`: Opcional, até 200.000 caracteres.
- `passphrase`: Opcional, até 4.096 caracteres.

---

## 2. Frontend (App Router & Componentes)

### `app/layout.tsx`
Layout raiz da aplicação Next.js.

- **Metadados (`metadata`):**
  - Título: `'SSH Studio — Terminal web seguro'`
  - Descrição: `'Conecte-se a servidores SSH com segurança diretamente do navegador.'`
- **Viewport (`viewport`):**
  - `colorScheme: 'dark'`
  - `themeColor: '#0b1018'`
  - `userScalable: false`
- **Idioma e Telemetria:**
  - Define `<html lang="pt-BR">`.
  - Inclui o componente `<Analytics />` do `@vercel/analytics/next` apenas quando `process.env.NODE_ENV === 'production'`.

---

### `app/page.tsx`
Componente Client (`'use client'`) que renderiza a interface principal do **SSH Studio**.

- **Estado Local:**
  - `form` (`FormState`): Armazena `host`, `port` (padrão `'22'`), `username`, `password`, `privateKey` e `passphrase`.
  - `connected` (`boolean`): Indica se o usuário disparou a solicitação de conexão.
  - `showPassword` (`boolean`): Alterna a visibilidade do campo de senha (`text` vs `password`).
  - `showKey` (`boolean`): Alterna a aba de autenticação entre **Senha** (`false`) e **Chave privada** (`true`).
  - `status` (`'idle' | 'connecting' | 'connected'`): Controla os indicadores visuais de estado da conexão e o bloqueio do botão de envio.
- **Cálculo de `socketUrl`:**
  - Utiliza `useMemo` para construir dinamicamente `ws://<host>/ssh` ou `wss://<host>/ssh` com base em `window.location.protocol` e `window.location.host` quando `connected === true`.
- **Componente Interno `Field`:**
  - Wrapper reutilizável de `<label>` para padronizar rótulos, indicador `"opcional"` e textos de dica (`hint`).

---

### `components/Terminal.tsx`
Componente Client (`'use client'`) responsável pela instância do **Xterm.js** e pela comunicação WebSocket.

- **Props (`TerminalProps`):**
  - `socketUrl?: string` — URL do servidor WebSocket (`/ssh`). Quando omitida, o terminal exibe a mensagem de boas-vindas em modo local (`SSH Studio • terminal pronto`).
  - `onStatusChange?: (status: 'connecting' | 'connected' | 'closed' | 'error') => void` — Callback disparado conforme o ciclo de vida do WebSocket muda.
- **Configuração do XTerm:**
  - Fonte: `'JetBrains Mono, SFMono-Regular, Consolas, monospace'`, tamanho `13`, `lineHeight: 1.45`.
  - `convertEol: true`, `scrollback: 3000`, `cursorBlink: true`.
  - Tema escuro personalizado alinhado à paleta da aplicação (`background: '#0b1018'`, `cursor: '#72e0a3'`, etc.).
  - Carrega `FitAddon` (`@xterm/addon-fit`) para ajustar automaticamente colunas e linhas ao tamanho do container DOM.
- **Limpeza (`cleanup` do `useEffect`):**
  - Remove o listener `resize` da janela, fecha o `WebSocket` ativo e descarta (`dispose()`) a instância do `XTerm`.

---

### `components/ui/button.tsx` e `lib/utils.ts`
- `lib/utils.ts`: Exporta a função `cn(...inputs: ClassValue[])`, combinando `clsx` e `tailwind-merge` para resolução de classes Tailwind.
- `components/ui/button.tsx`: Componente `Button` construído com `@base-ui/react/button` e `class-variance-authority` (`cva`), oferecendo as variantes `default`, `outline`, `secondary`, `ghost`, `destructive`, `link` e tamanhos `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`.

---

### `app/globals.css`
Folha de estilos global importando Tailwind v4 (`@import 'tailwindcss'`), `tw-animate-css` e `shadcn/tailwind.css`.
- Define regras base para `input:not([type='file'])`, ícones posicionados em campos (`.field-icon`) e customização da barra de rolagem do viewport do Xterm (`.xterm-viewport::-webkit-scrollbar`).

---

## 3. Pontos de Atenção e Divergências Atuais

Durante a leitura integral do código-fonte, foram identificados os seguintes comportamentos na implementação atual que merecem atenção em futuras manutenções:

1. **Envio do Payload `connect` após abertura do WebSocket:**
   - Em `server.ts` (linhas 28–46), o servidor aguarda uma mensagem WebSocket com `{ type: 'connect', data: { host, port, username, ... } }` para iniciar a sessão `ssh2`.
   - Em `app/page.tsx` e `components/Terminal.tsx`, o formulário define `connected = true` e abre o WebSocket em `/ssh`, mas `form` ainda não é passado como prop para `<Terminal />` nem enviado no `socket.onopen`. Como consequência, o WebSocket conecta-se, porém o comando `connect` com as credenciais do formulário não chega a ser disparado automaticamente.
2. **Leitura do Arquivo de Chave Privada (`.key` / `.pem`):**
   - Em `app/page.tsx` (linha 44), o `<input type="file">` executa `update('privateKey', e.target.files?.[0]?.name ?? '')`, armazenando apenas o **nome do arquivo** em vez do seu conteúdo em texto (via `FileReader` ou `file.text()`), que é o esperado pelo `ssh2`.
3. **Formato da Mensagem `resize`:**
   - `components/Terminal.tsx` (linha 49) envia `{ type: 'resize', cols: terminal.cols, rows: terminal.rows }`.
   - `server.ts` (linhas 48–50) verifica `typeof message.data === 'object'` e lê `message.data.cols` e `message.data.rows`. Para que o redimensionamento surta efeito no `ssh2`, os campos `cols` e `rows` precisam estar dentro da propriedade `data` (ou o servidor deve lê-los da raiz da mensagem).
4. **Callback `onStatusChange` estável no `useEffect`:**
   - Em `app/page.tsx` (linha 50), a prop `onStatusChange={(value) => value === 'connected' ? setStatus('connected') : undefined}` é recriada a cada renderização. Como `onStatusChange` está na lista de dependências do `useEffect` de `components/Terminal.tsx` (linha 77), qualquer mudança de estado em `Page` (como `setStatus('connected')` ou digitação no formulário após conectado) faz o `useEffect` do terminal reexecutar, fechando o WebSocket e recriando o `XTerm`.
5. **Botões de Ação Secundários da Interface:**
   - Os botões de cabeçalho/barra do terminal (*Nova conexão*, *Copiar saída*, *Reiniciar terminal*, *Tela cheia*, *Configurações*, *Ajuda*, *Tema escuro*) estão presentes na camada visual em `app/page.tsx`, mas ainda não possuem handlers `onClick` conectados.

