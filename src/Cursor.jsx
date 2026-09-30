import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

// what counts as "interactive" (ring grows + turns accent) and "inert" (dashed ring + slash, mirrors the copy-email state)
const HOT = 'a[href],button:not(:disabled),select,[role="button"],summary,input,textarea'
const OFF = 'button:disabled,[aria-disabled="true"]'
const TRAILS = [0, 1, 2, 3, 4, 5]

export default function Cursor() {
  const [on, setOn] = useState(false)
  const root = useRef(null)

  // only for real mouse pointers, and never when the OS asks for reduced motion
  useEffect(() => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setOn(true)
  }, [])

  useEffect(() => {
    if (!on) return
    const el = root.current
    const dot = el.querySelector('.cur-dot')
    const ring = el.querySelector('.cur-ring')
    const trails = [...el.querySelectorAll('.cur-trail')]
    const html = document.documentElement
    html.classList.add('eb-cursor') // hides the native cursor only once we are live

    gsap.set([dot, ring, ...trails], { xPercent: -50, yPercent: -50, x: -100, y: -100 })
    const to = (node, duration) => ({
      x: gsap.quickTo(node, 'x', { duration, ease: 'power3.out' }),
      y: gsap.quickTo(node, 'y', { duration, ease: 'power3.out' }),
    })
    const ringT = to(ring, 0.3)
    const trailT = trails.map((n, i) => to(n, 0.14 + i * 0.06))

    let hot = false, off = false, down = false, live = false
    const resize = () => gsap.to(ring, { scale: (hot ? 1.55 : off ? 1.25 : 1) * (down ? 0.82 : 1), duration: 0.28, ease: 'power3.out' })

    const move = (e) => {
      const { clientX: x, clientY: y, target } = e
      gsap.set(dot, { x, y }) // the dot is never late
      ringT.x(x); ringT.y(y)
      trailT.forEach((t) => { t.x(x); t.y(y) })
      if (!live) { live = true; el.classList.add('is-on') }
      const node = target instanceof Element ? target : null
      const h = !!(node && node.closest(HOT)), o = !!(node && node.closest(OFF))
      if (h !== hot || o !== off) {
        hot = h; off = o
        el.classList.toggle('is-hot', hot)
        el.classList.toggle('is-off', off)
        resize()
      }
    }
    const leave = () => { live = false; el.classList.remove('is-on') }
    const enter = () => { if (!live) { live = true; el.classList.add('is-on') } }
    const downH = () => { down = true; el.classList.add('is-down'); resize() }
    const upH = () => { down = false; el.classList.remove('is-down'); resize() }

    addEventListener('pointermove', move)
    addEventListener('pointerdown', downH)
    addEventListener('pointerup', upH)
    document.addEventListener('mouseenter', enter)
    document.addEventListener('mouseleave', leave)
    addEventListener('blur', leave)

    return () => {
      removeEventListener('pointermove', move)
      removeEventListener('pointerdown', downH)
      removeEventListener('pointerup', upH)
      document.removeEventListener('mouseenter', enter)
      document.removeEventListener('mouseleave', leave)
      removeEventListener('blur', leave)
      gsap.killTweensOf([dot, ring, ...trails])
      html.classList.remove('eb-cursor')
    }
  }, [on])

  if (!on) return null
  return (
    <div className="cursor" ref={root} aria-hidden="true">
      {TRAILS.map((i) => <i className="cur-trail" key={i} />)}
      <i className="cur-ring" />
      <i className="cur-dot" />
    </div>
  )
}
