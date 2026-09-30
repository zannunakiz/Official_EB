import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Scene from './Scene'
import { TH, S } from './themes'
import { Toaster, toast } from 'sonner'
gsap.registerPlugin(ScrollTrigger)

const G = '#/\\<>[]{}=+*%$01ABCDEFXZ'
const LINKS = {
  repo: 'https://github.com/zannunakiz/Enigma-Blitz',
  github: 'https://github.com/zannunakiz',
  instagram: 'https://www.instagram.com/richky_4srg',
}
const EMAIL = 'richky.abednego@gmail.com'
const TICKER = ['100% free to use', 'Runs entirely on your machine', 'Develop fast with no cost', 'New versions under development', 'Developed by 4SRG']
const MANIFESTO = "Your project is scattered across dozens of files. Pasting them into an AI one by one is slow, manual work. Enigma Blitz gathers the files you choose, compiles them into one clean context blob, and hands your whole project to the model in seconds."
const PANELS = [
  ['01', 'Pick', 'Files', 'Browse your project inside PROJECT_CONTEXT, search any file by name across the whole tree, and fold entire folders into the selection in a single click.', 'Visual browser · whole-project search'],
  ['02', 'Compile', 'Context', 'Reorder your selection, skip the noise — node_modules, .git, build output, lock files — and compile everything into one clean Context.txt, in exactly the shape an AI expects.', 'One file · copy or download'],
  ['03', 'Paste', 'Prompt', 'Drop the blob into ChatGPT, Claude, Gemini or DeepSeek and prompt with your entire project in scope. Nothing ever leaves your machine.', '100% local · zero uploads'],
]
const STATS = [[2, 'versions to choose from'], [100, '% free to use'], [0, 'files uploaded or stored'], [3, 'steps: pick, compile, paste']]

function Scramble({ text, delay = 0, as: Tag = 'span', className }) {
  const [out, setOut] = useState(text)
  useEffect(() => {
    const o = { v: 0 }
    const tw = gsap.to(o, {
      v: 1, duration: 1.6, delay, ease: 'power2.out',
      onUpdate: () => {
        const n = Math.floor(o.v * text.length)
        setOut(text.slice(0, n) + [...text.slice(n)].map((c) => (c === ' ' ? ' ' : G[(Math.random() * G.length) | 0])).join(''))
      },
      onComplete: () => setOut(text),
    })
    return () => tw.kill()
  }, [text, delay])
  return <Tag className={className}>{out}</Tag>
}

function Stat({ to, label }) {
  const ref = useRef(null), [v, setV] = useState(0)
  useEffect(() => {
    const o = { v: 0 }
    const tw = gsap.to(o, { v: to, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: ref.current, start: 'top 85%' }, onUpdate: () => setV(Math.round(o.v)) })
    return () => { tw.scrollTrigger && tw.scrollTrigger.kill(); tw.kill() }
  }, [to])
  return <div ref={ref}><b>{v}</b><span>{label}</span></div>
}

export default function App() {
  const root = useRef(null)
  const [ti, setTi] = useState(() => { try { return +localStorage.getItem('eb-t') || 0 } catch { return 0 } })
  const [md, setMd] = useState(() => {
    try { const m = localStorage.getItem('eb-m'); if (m !== null) return +m } catch {}
    return matchMedia('(prefers-color-scheme: light)').matches ? 1 : 0
  })
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef(null)

  // theme + mode -> CSS variables (colors and fonts) and Three.js colors
  useEffect(() => {
    const t = TH[ti], o = md ? 3 : 0, st = document.documentElement.style
    st.setProperty('--bg', t[3 + o]); st.setProperty('--ink', t[4 + o]); st.setProperty('--acc', t[5 + o])
    st.setProperty('--serif', `'${t[1]}',Georgia,serif`); st.setProperty('--mono', `'${t[2]}',ui-monospace,monospace`)
    st.colorScheme = md ? 'light' : 'dark'
    S.ink = t[4 + o]; S.acc = t[5 + o]
    try { localStorage.setItem('eb-t', ti); localStorage.setItem('eb-m', md) } catch {}
    const id = setTimeout(() => ScrollTrigger.refresh(), 500)
    return () => clearTimeout(id)
  }, [ti, md])

  useEffect(() => { document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh()) }, [])
  useEffect(() => () => clearTimeout(copyTimer.current), [])

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => (S.p = s.progress) })
      gsap.to('.tk-in', { xPercent: -50, duration: 30, ease: 'none', repeat: -1 })
      gsap.to('.w', { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: '.manifesto', start: 'top 65%', end: 'bottom 70%', scrub: true } })
      const tr = root.current.querySelector('.track')
      gsap.to(tr, { x: () => -(tr.scrollWidth - innerWidth), ease: 'none', scrollTrigger: { trigger: '#hs', pin: true, scrub: 0.6, start: 'top top', end: () => '+=' + tr.scrollWidth * 0.9, invalidateOnRefresh: true } })
      gsap.utils.toArray('.panel .n').forEach((n) => gsap.from(n, { yPercent: 30, opacity: 0, scrollTrigger: { trigger: '#hs', start: 'top 60%', end: 'top top', scrub: true } }))
      const blitz = (v) => () => gsap.to(S, { blitz: v, duration: 0.8 })
      ScrollTrigger.create({ trigger: '.stats', start: 'top 80%', end: 'bottom top', onEnter: blitz(1), onLeaveBack: blitz(0), onLeave: blitz(0.2), onEnterBack: blitz(1) })
      gsap.from('.cta h2', { yPercent: 30, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.cta', start: 'top 60%' } })
      gsap.from('.dl a', { y: 18, opacity: 0, duration: .7, stagger: .08, ease: 'power2.out', scrollTrigger: { trigger: '.dl', start: 'top 85%' } })
    }, root)
    return () => ctx.revert()
  }, [])

  const copyEmail = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(EMAIL)
      } else {
        const ta = document.createElement('textarea')
        ta.value = EMAIL
        ta.setAttribute('readonly', '')
        ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0'
        document.body.appendChild(ta)
        ta.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(ta)
        if (!ok) throw new Error('copy rejected')
      }
      toast.success('Email copied to clipboard')
      setCopied(true)
      clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy — ' + EMAIL)
    }
  }

  const toTop = () => {
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' })
  }

  return (
    <div ref={root}>
      <Scene />
      <nav>
        <button type="button" className="brand" onClick={toTop} aria-label="Scroll back to top"><b>Enigma/Blitz</b></button>
        <div className="ctl">
          <select aria-label="Theme" value={ti} onChange={(e) => setTi(+e.target.value)}>
            {TH.map((t, i) => <option key={t[0]} value={i}>{i + 1}. {t[0]} · {t[1]}</option>)}
          </select>
          <button aria-label="Toggle dark or light mode" onClick={() => setMd(md ? 0 : 1)}>{md ? '☀ Light' : '☾ Dark'}</button>
        </div>
        <a href="#download">Download</a>
      </nav>
      <main>
        <section className="hero">
          <Scramble as="div" className="tag" text="Flash context compiler · V1 & V2 live" delay={0.3} />
          <h1><Scramble text="Enigma" delay={0.55} /><Scramble as="i" text="Blitz" delay={0.8} /></h1>
          <div className="sub">
            <p>A local-first context compiler that turns scattered project files into one clean, ready-to-paste blob — then hands your whole project to any AI in seconds.</p>
            <span className="scroll">Scroll to compile ↓</span>
          </div>
        </section>
        <div className="tick"><div className="tk-in">{[...TICKER, ...TICKER].map((t, i) => <span key={i}>{t}</span>)}</div></div>
        <section className="manifesto"><p>{MANIFESTO.split(' ').map((w, i) => <span className="w" key={i}>{w}</span>)}</p></section>
        <section className="h" id="hs">
          <div className="track">
            {PANELS.map(([n, a, b, p, s]) => (
              <div className="panel" key={n}>
                <div className="n">{n}</div>
                <div><h2>{a} <em>{b}</em></h2><p>{p}</p><small>{s}</small></div>
              </div>
            ))}
          </div>
        </section>
        <section className="stats">{STATS.map(([n, l]) => <Stat key={l} to={n} label={l} />)}</section>
        <section className="cta" id="download">
          <div className="tag">Open source · No keys, no sign-up · New versions under development</div>
          <h2>Ready to <i>Blitz?</i></h2>
          <div className="dl">
            <a href={LINKS.repo} target="_blank" rel="noopener noreferrer">View on GitHub ↗</a>
            <a className="primary" href="/downloads/EnigmaBlitz(V1-GUI).zip" download>Download V1 · GUI</a>
            <a className="primary" href="/downloads/EnigmaBlitz(V2-SingleFile).zip" download>Download V2 · Single file</a>
          </div>
          <div className="note">V1 — GUI web app (Next.js, full browser UI) · V2 — single-file Python script (EB.py, Python 3.7+, zero dependencies)</div>
        </section>
      </main>
      <footer>
        <span>© 2026 Enigma Blitz · Developed by 4SRG</span>
        <span className="contact">
          <a href={LINKS.github} target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href={LINKS.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
          <button type="button" onClick={copyEmail} disabled={copied} aria-live="polite" aria-label={copied ? 'Email copied to clipboard' : 'Copy email address to clipboard'}>{copied ? 'Copied !' : EMAIL}</button>
        </span>
      </footer>
      <Toaster
        position="bottom-center"
        theme={md ? 'light' : 'dark'}
        offset={20}
        toastOptions={{
          style: {
            background: 'var(--bg)',
            color: 'var(--ink)',
            border: '1px solid var(--line)',
            borderRadius: 0,
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            letterSpacing: '.16em',
            textTransform: 'uppercase',
            boxShadow: 'none',
          },
        }}
      />
    </div>
  )
}
