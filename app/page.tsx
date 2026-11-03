'use client'

import { useMemo, useState } from 'react'
import { ArrowUpRight, Check, ChevronDown, CircleHelp, Cloud, Command, Copy, FileKey2, KeyRound, LockKeyhole, Maximize2, Moon, Network, Play, Plus, RotateCcw, Server, Settings2, ShieldCheck, TerminalSquare, Upload, Wifi, X } from 'lucide-react'
import { Terminal } from '@/components/Terminal'

type FormState = { host: string; port: string; username: string; password: string; privateKey: string; passphrase: string }

const initialForm: FormState = { host: '', port: '22', username: '', password: '', privateKey: '', passphrase: '' }

export default function Page() {
  const [form, setForm] = useState(initialForm)
  const [connected, setConnected] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle')
  const socketUrl = useMemo(() => connected ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ssh` : undefined, [connected])

  const update = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.host || !form.username) return
    setStatus('connecting')
    setConnected(true)
  }

  return (
    <main className="min-h-screen bg-[#0b1018] text-[#d3dae6]">
      <header className="flex h-[68px] items-center justify-between border-b border-white/[0.07] bg-[#0d141e]/90 px-5 lg:px-8">
        <div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-lg bg-[#74e2a5]/10 text-[#74e2a5]"><TerminalSquare /></div><div><div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white">SSH Studio <span className="rounded bg-white/[0.07] px-1.5 py-0.5 text-[10px] font-medium text-[#8290a3]">BETA</span></div><div className="text-[11px] text-[#667589]">Terminal seguro no navegador</div></div></div>
        <div className="flex items-center gap-4 text-xs text-[#8290a3]"><div className="hidden items-center gap-2 sm:flex"><ShieldCheck className="size-3.5 text-[#74e2a5]" /> Conexão protegida</div><button aria-label="Ajuda" className="rounded-md p-2 hover:bg-white/[0.06]"><CircleHelp className="size-4" /></button><button aria-label="Tema escuro" className="rounded-md p-2 hover:bg-white/[0.06]"><Moon className="size-4" /></button><div className="size-6 rounded-full bg-gradient-to-br from-[#7dd3fc] to-[#74e2a5]" /></div>
      </header>

      <div className="mx-auto flex max-w-[1500px] flex-col gap-5 p-5 lg:p-7">
        <div className="flex items-end justify-between"><div><div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#74e2a5]"><span className="size-1.5 rounded-full bg-[#74e2a5]" /> Workspace</div><h1 className="text-2xl font-semibold tracking-tight text-white">Conexões</h1><p className="mt-1 text-sm text-[#718096]">Acesse sua infraestrutura com confiança.</p></div><button className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs font-medium text-[#b7c2d2] transition hover:bg-white/[0.07] sm:flex"><Plus className="size-4" /> Nova conexão</button></div>

        <div className="grid gap-5 xl:grid-cols-[370px_minmax(0,1fr)]">
          <section className="rounded-xl border border-white/[0.08] bg-[#111a26] shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div className="flex items-center gap-2.5"><div className="grid size-7 place-items-center rounded-md bg-[#7dd3fc]/10 text-[#7dd3fc]"><Server className="size-3.5" /></div><h2 className="text-sm font-semibold text-white">Detalhes da conexão</h2></div><button className="text-[#667589] hover:text-white" aria-label="Configurações"><Settings2 className="size-4" /></button></div>
            <form onSubmit={submit} className="flex flex-col gap-5 p-5">
              <Field label="Host" hint="IP ou domínio do servidor"><div className="relative"><Network className="field-icon" /><input required value={form.host} onChange={(e) => update('host', e.target.value)} placeholder="ex: 192.168.1.100" /></div></Field>
              <div className="grid grid-cols-[1fr_92px] gap-3"><Field label="Usuário"><input required value={form.username} onChange={(e) => update('username', e.target.value)} placeholder="root" /></Field><Field label="Porta"><input value={form.port} onChange={(e) => update('port', e.target.value)} inputMode="numeric" /></Field></div>
              <Field label="Autenticação" hint="Escolha uma forma de autenticação"><div className="flex gap-1 rounded-lg bg-[#0b1018] p-1"><button type="button" onClick={() => setShowKey(false)} className={`flex-1 rounded-md px-2 py-2 text-xs ${!showKey ? 'bg-[#202d3c] text-white' : 'text-[#718096]'}`}><KeyRound className="mr-1.5 inline size-3.5" />Senha</button><button type="button" onClick={() => setShowKey(true)} className={`flex-1 rounded-md px-2 py-2 text-xs ${showKey ? 'bg-[#202d3c] text-white' : 'text-[#718096]'}`}><FileKey2 className="mr-1.5 inline size-3.5" />Chave privada</button></div></Field>
              {!showKey ? <Field label="Senha" optional><div className="relative"><LockKeyhole className="field-icon" /><input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="••••••••••••" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-[10px] text-[#718096]">{showPassword ? 'Ocultar' : 'Mostrar'}</button></div></Field> : <><Field label="Chave privada" hint="A chave é usada apenas nesta sessão"><label className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-[#34465b] bg-[#0b1018] px-3.5 py-3 transition hover:border-[#74e2a5]/60"><div className="flex items-center gap-2.5"><Upload className="size-4 text-[#74e2a5]" /><span className="text-xs text-[#91a0b3]">Carregar arquivo .key ou .pem</span></div><span className="text-[10px] text-[#64748b]">Procurar</span><input type="file" className="sr-only" accept=".key,.pem" onChange={(e) => update('privateKey', e.target.files?.[0]?.name ?? '')} /></label></Field><Field label="Passphrase" optional><input type="password" value={form.passphrase} onChange={(e) => update('passphrase', e.target.value)} placeholder="Se a chave estiver protegida" /></Field></>}
              <div className="flex items-center gap-2 rounded-lg border border-[#7dd3fc]/10 bg-[#7dd3fc]/[0.04] px-3 py-2.5 text-[11px] leading-4 text-[#8194aa]"><ShieldCheck className="size-4 shrink-0 text-[#7dd3fc]" /> Credenciais nunca são armazenadas ou registradas.</div>
              <button type="submit" disabled={status === 'connecting'} className="flex items-center justify-center gap-2 rounded-lg bg-[#74e2a5] py-3 text-xs font-semibold text-[#07110c] transition hover:bg-[#8af0b5] disabled:cursor-wait disabled:opacity-70"><Play className="size-3.5 fill-current" />{status === 'connecting' ? 'Abrindo sessão...' : 'Conectar ao servidor'}</button>
            </form>
          </section>

          <section className="flex min-h-[620px] flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b1018] shadow-2xl shadow-black/20"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] bg-[#111a26] px-4 py-3"><div className="flex items-center gap-3"><span className={`size-2 rounded-full ${status === 'connected' ? 'bg-[#74e2a5]' : 'bg-[#64748b]'}`} /><div><div className="text-xs font-medium text-white">{form.host || 'Nenhum servidor conectado'}</div><div className="text-[10px] text-[#667589]">{form.username ? `${form.username}@${form.host || 'servidor'}:${form.port}` : 'Configure uma conexão ao lado'}</div></div>{status === 'connected' && <span className="rounded bg-[#74e2a5]/10 px-2 py-1 text-[10px] font-medium text-[#74e2a5]">Conectado</span>}</div><div className="flex items-center gap-1 text-[#667589]"><button aria-label="Copiar saída" className="rounded p-2 hover:bg-white/[0.06]"><Copy className="size-3.5" /></button><button aria-label="Reiniciar terminal" className="rounded p-2 hover:bg-white/[0.06]"><RotateCcw className="size-3.5" /></button><button aria-label="Tela cheia" className="rounded p-2 hover:bg-white/[0.06]"><Maximize2 className="size-3.5" /></button></div></div><div className="flex-1 p-5"><Terminal socketUrl={socketUrl} onStatusChange={(value) => value === 'connected' ? setStatus('connected') : undefined} /></div><div className="flex items-center justify-between border-t border-white/[0.07] bg-[#0d141e] px-4 py-2 text-[10px] text-[#667589]"><span className="flex items-center gap-1.5"><Wifi className="size-3" /> WebSocket seguro</span><span className="flex items-center gap-3"><span>UTF-8</span><span>120 × 32</span><span className="flex items-center gap-1"><Command className="size-3" /> Atalhos</span></span></div></section>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 px-1 pt-1 text-[11px] text-[#536174]"><span className="flex items-center gap-1.5"><LockKeyhole className="size-3" /> Suas sessões são privadas e efêmeras.</span><span className="flex items-center gap-1 hover:text-[#9aa8ba]">Documentação <ArrowUpRight className="size-3" /></span></footer>
      </div>
    </main>
  )
}

function Field({ label, hint, optional, children }: { label: string; hint?: string; optional?: boolean; children: React.ReactNode }) { return <label className="flex flex-col gap-2"><span className="flex items-center justify-between text-[11px] font-medium text-[#aab6c6]">{label}{optional && <span className="font-normal text-[#5d6b7e]">opcional</span>}</span>{children}{hint && <span className="text-[10px] text-[#5d6b7e]">{hint}</span>}</label> }
