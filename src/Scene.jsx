import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { S } from './themes'

export default function Scene() {
  const ref = useRef(null)
  useEffect(() => {
    const r = new THREE.WebGLRenderer({ canvas: ref.current, alpha: true, antialias: true })
    r.setPixelRatio(Math.min(devicePixelRatio, 2))
    const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    cam.position.z = 10
    const acc = new THREE.Color(), ink = new THREE.Color()
    const grp = new THREE.Group(); sc.add(grp)
    const rings = []
    const ring = (rad, n, len, col, op) => {
      const g = new THREE.Group(), pts = []
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, l = i % 5 === 0 ? len * 2 : len
        pts.push(Math.cos(a) * rad, Math.sin(a) * rad, 0, Math.cos(a) * (rad + l), Math.sin(a) * (rad + l), 0)
      }
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
      g.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op })))
      g.add(new THREE.Mesh(new THREE.TorusGeometry(rad, 0.012, 6, 160), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op })))
      return g
    }
    ;[[2.2, 26, 0.18, ink, 0.7], [3.0, 40, 0.16, acc, 0.9], [3.9, 52, 0.2, ink, 0.5], [4.9, 64, 0.22, ink, 0.35]].forEach((c, i) => {
      const g = ring(...c); g.position.z = -i * 0.7; grp.add(g); rings.push(g)
    })
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 1), new THREE.MeshBasicMaterial({ color: acc, wireframe: true, transparent: true, opacity: 0.85 }))
    grp.add(core)
    const N = 1800, pos = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      const u = Math.random() * Math.PI * 2, v = Math.acos(2 * Math.random() - 1), rr = 5 + Math.random() * 9
      pos.set([rr * Math.sin(v) * Math.cos(u), rr * Math.sin(v) * Math.sin(u), rr * Math.cos(v)], i * 3)
    }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const pm = new THREE.PointsMaterial({ color: ink, size: 0.035, transparent: true, opacity: 0.6 })
    const pts = new THREE.Points(pg, pm); sc.add(pts)
    const size = () => { r.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix() }
    const move = (e) => { S.mx = e.clientX / innerWidth - 0.5; S.my = e.clientY / innerHeight - 0.5 }
    size(); addEventListener('resize', size); addEventListener('pointermove', move)
    const clock = new THREE.Clock(); let id
    const loop = () => {
      const t = clock.getElapsedTime(), p = S.p, b = S.blitz
      ink.set(S.ink); acc.set(S.acc); pm.color.copy(ink)
      rings.forEach((g, i) => {
        const d = i % 2 ? 1 : -1
        g.rotation.z = t * 0.05 * d * (i + 1) + p * Math.PI * (2 + i) * d
        g.children.forEach((m) => m.material.color.copy(i === 1 ? acc : ink))
      })
      core.material.color.copy(acc)
      core.rotation.set(t * 0.3 + p * 4, t * 0.2, 0)
      core.scale.setScalar(1 + b * 2.2 + Math.sin(t * 2) * 0.04)
      grp.rotation.x = p * 1.1 + S.my * 0.4
      grp.rotation.y = -0.5 + p * 1.4 + S.mx * 0.5
      grp.position.x = (1 - Math.min(p * 4, 1)) * 2.2 * (innerWidth > 760 ? 1 : 0)
      cam.position.z = 10 - p * 3 - b * 3
      pts.rotation.y = t * 0.02 + p * 1.5; pts.scale.z = 1 + b * 6
      r.render(sc, cam); id = requestAnimationFrame(loop)
    }
    loop()
    return () => {
      cancelAnimationFrame(id); removeEventListener('resize', size); removeEventListener('pointermove', move)
      r.dispose(); pg.dispose()
    }
  }, [])
  return <canvas id="gl" ref={ref} />
}
