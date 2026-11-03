# SSH Studio — Documentação do Projeto

**SSH Studio** é uma aplicação web de terminal SSH interativo que permite conectar-se a servidores remotos diretamente pelo navegador utilizando **Next.js**, **WebSockets (`ws`)**, **Xterm.js (`@xterm/xterm`)** e **SSH2 (`ssh2`)**.

---

## Sumário da Documentação

- **[Visão Geral e Guia de Início Rápido](./README.md)** *(este documento)*
- **[Arquitetura e Protocolo WebSocket](./arquitetura.md)** — Fluxo de dados, diagramas de sequência e especificação das mensagens entre cliente e servidor.
- **[Referência de Código e Módulos](./referencia-codigo.md)** — Detalhamento técnico de todos os arquivos fonte, componentes React, validações e pontos de atenção.

---

## Stack Tecnológica

| Camada | Tecnologia | Versão (`package.json`) | Papel no Projeto |
| :--- | :--- | :--- | :--- |
| **Framework Web** | Next.js (App Router) | `16.4.3` | Renderização da interface e roteamento HTTP |
| **UI / Biblioteca** | React / React DOM | `^19` | Construção dos componentes de interface |
| **Estilização** | Tailwind CSS v4 + shadcn/ui | `^4.3.3` / `^4.11.0` | Estilização utilitária em tema escuro (`#0b1018`) |
| **Ícones** | Lucide React | `^1.16.0` | Ícones da interface e indicadores visuais |
| **Emulador de Terminal** | `@xterm/xterm` + `@xterm/addon-fit` | `^6.0.0` / `^0.11.0` | Renderização do terminal ANSI/VT no navegador e ajuste automático de dimensões |
| **Servidor Customizado** | Node.js `http` + `ws` | `^8.22.1` | Servidor HTTP unificado com endpoint WebSocket em `/ssh` |
| **Cliente SSH** | `ssh2` | `^1.17.0` | Conexão SSH2 e abertura de canal shell (`xterm-256color`) no backend |
| **Validação** | `zod` | `^4.6.7` | Validação dos parâmetros de conexão SSH recebidos via WebSocket |
| **Linguagem** | TypeScript | `5.7.3` | Tipagem estática no frontend e backend |

---

## Estrutura de Diretórios

```text
ssh-client/
├── app/
│   ├── globals.css          # Estilos globais, tema dark e customização do Xterm
│   ├── layout.tsx           # Layout raiz (pt-BR), metadados, viewport e Vercel Analytics
│   └── page.tsx             # Página principal com formulário de conexão e container do terminal
├── components/
│   ├── Terminal.tsx         # Componente client-side que encapsula o Xterm.js e a conexão WebSocket
│   └── ui/
│       └── button.tsx       # Componente base de botão (shadcn / Base UI + CVA)
├── lib/
│   ├── ssh-validation.ts    # Schema Zod (connectionSchema) para validação dos dados de acesso SSH
│   └── utils.ts             # Função utilitária cn() (clsx + tailwind-merge)
├── public/                  # Ativos estáticos e ícones da aplicação
├── server.ts                # Servidor Node.js customizado integrando Next.js + WebSocketServer (/ssh) + ssh2
├── components.json          # Configuração do shadcn/ui (estilo base-nova)
├── next.config.mjs          # Configurações do Next.js
├── postcss.config.mjs       # Configuração do PostCSS com @tailwindcss/postcss
├── pnpm-workspace.yaml      # Configurações do workspace pnpm
├── tsconfig.json            # Configurações do compilador TypeScript
└── package.json             # Scripts e dependências do projeto
```

---

## Como Executar o Projeto

### Pré-requisitos
- **Node.js** (versão 20+ recomendada; tipagem configurada para `@types/node: ^24`)
- **pnpm** (`pnpm@12.3.4` especificado em `packageManager`)

### Instalação

```bash
pnpm install
```

### Scripts Disponíveis

| Script | Comando | Descrição |
| :--- | :--- | :--- |
| `pnpm dev` | `next dev` | Inicia apenas o servidor de desenvolvimento padrão do Next.js (**sem** o servidor WebSocket `/ssh`). |
| `pnpm dev:ssh` | `tsx server.ts` | Inicia o servidor customizado completo (Next.js + WebSocket SSH em `/ssh`) em modo de desenvolvimento. |
| `pnpm build` | `next build` | Compila a aplicação Next.js para produção. |
| `pnpm start` | `next start` | Inicia o servidor padrão do Next.js em produção (**sem** suporte ao WebSocket `/ssh`). |
| `pnpm start:ssh` | `NODE_ENV=production tsx server.ts` | Inicia o servidor customizado completo em modo de produção. |

> [!IMPORTANT]
> Para utilizar a funcionalidade de conexão SSH, sempre execute o projeto com `pnpm dev:ssh` (desenvolvimento) ou `pnpm build && pnpm start:ssh` (produção), pois o endpoint WebSocket `/ssh` é registrado pelo arquivo `server.ts`.

### Variáveis de Ambiente

O arquivo `server.ts` lê as seguintes variáveis de ambiente opcionais:

| Variável | Valor Padrão | Descrição |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` (implícito) | Define se o Next.js roda em modo `dev` (`NODE_ENV !== 'production'`). |
| `HOSTNAME` | `0.0.0.0` | Endereço de bind do servidor HTTP. |
| `PORT` | `3000` | Porta TCP na qual o servidor HTTP e WebSocket escutam. |

