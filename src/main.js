import './style.css'
import p5 from 'p5'

const sceneState = {
  prompt: 'slow mechanical dawn',
  interventionLevel: 2,
  section: 'build',
  tempo: 112,
  density: 0.42,
  chaos: 0.16,
  repetition: 0.64,
  palette: ['#0b1020', '#7dd3fc', '#f472b6'],
  motion: 'pulse',
  phase: 0,
  activity: [
    'System initialized.',
    'Gemma adapter pending.',
    'p5.js stage attached.',
  ],
}

const interventionLabels = ['Observe', 'Suggest', 'Assist', 'Guide', 'Perform', 'Possess']
const sections = ['drift', 'build', 'fracture', 'recovery', 'surge', 'afterglow']
const motions = ['still', 'pulse', 'glide', 'shiver', 'erratic', 'flood']

let p5Instance = null

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '')
  const values = normalized.match(/[\da-f]{2}/gi)?.map((v) => Number.parseInt(v, 16)) ?? [0, 0, 0]
  return values.length === 3 ? values : [0, 0, 0]
}

function interpolateHex(a, b, t) {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const mix = (x, y) => Math.round(x + (y - x) * t)
  return `rgb(${mix(ar, br)}, ${mix(ag, bg)}, ${mix(ab, bb)})`
}

function generatePalette(level) {
  const palettes = [
    ['#020617', '#1d4ed8', '#38bdf8'],
    ['#081120', '#0f766e', '#5eead4'],
    ['#0b1020', '#7dd3fc', '#f472b6'],
    ['#140f2d', '#a78bfa', '#fb7185'],
    ['#18071a', '#f97316', '#facc15'],
    ['#03010b', '#c084fc', '#fb7185'],
  ]
  return palettes[level]
}

function mutateState(level) {
  const normalized = level / 5
  sceneState.interventionLevel = level
  sceneState.tempo = Math.round(96 + normalized * 54)
  sceneState.density = clamp(0.24 + normalized * 0.56, 0, 1)
  sceneState.chaos = clamp(0.08 + normalized * 0.72, 0, 1)
  sceneState.repetition = clamp(0.82 - normalized * 0.44, 0, 1)
  sceneState.section = sections[level]
  sceneState.motion = motions[level]
  sceneState.palette = generatePalette(level)
  sceneState.activity.unshift(`Intervention ${level} · ${interventionLabels[level]} · ${sceneState.section}`)
  sceneState.activity = sceneState.activity.slice(0, 8)
}

function ensureP5Stage() {
  const mount = document.querySelector('#p5-stage')
  if (!mount) return

  if (p5Instance) {
    p5Instance.remove()
    p5Instance = null
  }

  p5Instance = new p5((sketch) => {
    sketch.setup = () => {
      const canvas = sketch.createCanvas(mount.clientWidth, mount.clientHeight)
      canvas.parent(mount)
      sketch.noStroke()
    }

    sketch.windowResized = () => {
      sketch.resizeCanvas(mount.clientWidth, mount.clientHeight)
    }

    sketch.draw = () => {
      sceneState.phase += 0.008 + sceneState.chaos * 0.012

      const [r1, g1, b1] = hexToRgb(sceneState.palette[0])
      const [r2, g2, b2] = hexToRgb(sceneState.palette[1])
      const [r3, g3, b3] = hexToRgb(sceneState.palette[2])
      const intensity = sceneState.interventionLevel / 5
      const pulse = (Math.sin(sceneState.phase * (1 + sceneState.density)) + 1) * 0.5

      sketch.background(r1, g1, b1, 255)

      for (let i = 0; i < 7; i += 1) {
        const t = i / 6
        const offset = Math.sin(sceneState.phase * (1.2 + t * 1.8) + i) * 40 * (0.2 + intensity)
        const y = sketch.height * (0.16 + t * 0.68)
        const alpha = 20 + intensity * 80 + t * 40
        sketch.fill(r2, g2, b2, alpha)
        sketch.ellipse(
          sketch.width * (0.5 + Math.cos(sceneState.phase + i) * 0.1),
          y + offset,
          sketch.width * (0.12 + sceneState.density * 0.36 + t * 0.08),
          sketch.height * (0.08 + pulse * 0.18 + t * 0.03),
        )
      }

      const particleCount = Math.round(18 + sceneState.density * 48)
      for (let i = 0; i < particleCount; i += 1) {
        const seed = i * 77.31
        const x = (Math.sin(sceneState.phase * 0.7 + seed) + 1) * 0.5 * sketch.width
        const y = (Math.cos(sceneState.phase * (0.4 + intensity) + seed * 0.3) + 1) * 0.5 * sketch.height
        const size = 2 + ((i % 6) + 1) * (1.2 + sceneState.chaos * 2.8)
        const alpha = 60 + (i % 5) * 20
        sketch.fill(r3, g3, b3, alpha)
        sketch.circle(x, y, size)
      }

      sketch.stroke(r3, g3, b3, 90)
      sketch.strokeWeight(1.2 + intensity * 2.4)
      sketch.noFill()
      const waveAmp = sketch.height * (0.04 + sceneState.chaos * 0.18)
      sketch.beginShape()
      for (let x = 0; x <= sketch.width; x += 16) {
        const noise = Math.sin(sceneState.phase * 1.8 + x * 0.018) * waveAmp
        const y = sketch.height * 0.5 + noise + Math.sin(x * 0.01 + sceneState.phase) * 12
        sketch.vertex(x, y)
      }
      sketch.endShape()
      sketch.noStroke()
    }
  })
}

function render() {
  const app = document.querySelector('#app')
  const intensity = sceneState.interventionLevel / 5
  const primary = sceneState.palette[0]
  const secondary = sceneState.palette[1]
  const accent = sceneState.palette[2]

  document.documentElement.style.setProperty('--bg-0', primary)
  document.documentElement.style.setProperty('--bg-1', secondary)
  document.documentElement.style.setProperty('--accent', accent)
  document.documentElement.style.setProperty('--accent-soft', interpolateHex(primary, accent, 0.4))
  document.documentElement.style.setProperty('--panel', `rgba(9, 12, 24, ${0.72 + intensity * 0.16})`)
  document.documentElement.style.setProperty('--line', `rgba(255, 255, 255, ${0.08 + intensity * 0.12})`)

  app.innerHTML = `
    <div class="shell">
      <header class="hero">
        <div>
          <p class="eyebrow">soft possession</p>
          <h1>Shared agency for p5.js + Strudel + Gemma.</h1>
          <p class="lede">
            A prototype for live-coded performance where intervention strength shifts from
            quiet suggestion to active co-performance.
          </p>
        </div>
        <div class="hero-card">
          <span class="hero-card__label">Current scene</span>
          <strong>${sceneState.section}</strong>
          <span>${sceneState.motion} motion · tempo ${sceneState.tempo}</span>
        </div>
      </header>

      <main class="grid">
        <section class="panel panel--wide">
          <div class="panel__head">
            <h2>Intent</h2>
            <span class="badge">MVP</span>
          </div>
          <label class="prompt">
            <span>Prompt</span>
            <textarea id="prompt-input" rows="3">${sceneState.prompt}</textarea>
          </label>
          <div class="slider-wrap">
            <div>
              <span class="label">Intervention</span>
              <strong id="level-label">${sceneState.interventionLevel} · ${interventionLabels[sceneState.interventionLevel]}</strong>
            </div>
            <input id="intervention" type="range" min="0" max="5" step="1" value="${sceneState.interventionLevel}" />
            <div class="ticks">${interventionLabels
              .map((label, index) => `<span ${index === sceneState.interventionLevel ? 'class="active"' : ''}>${label}</span>`)
              .join('')}</div>
          </div>
          <div class="actions">
            <button id="nudge">Nudge</button>
            <button id="freeze" class="ghost">Freeze AI</button>
          </div>
        </section>

        <section class="panel">
          <div class="panel__head">
            <h2>System state</h2>
          </div>
          <ul class="metrics">
            <li><span>Tempo</span><strong>${sceneState.tempo}</strong></li>
            <li><span>Density</span><strong>${sceneState.density.toFixed(2)}</strong></li>
            <li><span>Chaos</span><strong>${sceneState.chaos.toFixed(2)}</strong></li>
            <li><span>Repetition</span><strong>${sceneState.repetition.toFixed(2)}</strong></li>
          </ul>
          <div class="palette">${sceneState.palette.map((color) => `<span style="background:${color}"></span>`).join('')}</div>
        </section>

        <section class="panel">
          <div class="panel__head">
            <h2>Activity log</h2>
          </div>
          <ol class="activity">
            ${sceneState.activity.map((item) => `<li>${item}</li>`).join('')}
          </ol>
        </section>

        <section class="panel panel--wide stage">
          <div class="stage__visual">
            <div id="p5-stage" class="p5-stage"></div>
          </div>
          <div class="stage__text">
            <h2>Prototype direction</h2>
            <p>
              The stage is now rendered by p5.js. Next: connect Strudel transport and add a
              Gemma adapter that emits structured scene updates instead of freeform text.
            </p>
            <code>{ section: &quot;${sceneState.section}&quot;, motion: &quot;${sceneState.motion}&quot;, intervention: ${sceneState.interventionLevel} }</code>
          </div>
        </section>
      </main>
    </div>
  `

  document.querySelector('#intervention').addEventListener('input', (event) => {
    mutateState(Number(event.target.value))
    render()
  })

  document.querySelector('#prompt-input').addEventListener('change', (event) => {
    sceneState.prompt = event.target.value
    sceneState.activity.unshift(`Intent updated · ${sceneState.prompt}`)
    sceneState.activity = sceneState.activity.slice(0, 8)
    render()
  })

  document.querySelector('#nudge').addEventListener('click', () => {
    sceneState.activity.unshift('Nudge requested · placeholder for Gemma scene mutation')
    sceneState.activity = sceneState.activity.slice(0, 8)
    render()
  })

  document.querySelector('#freeze').addEventListener('click', () => {
    sceneState.activity.unshift('Freeze engaged · autonomous updates paused')
    sceneState.activity = sceneState.activity.slice(0, 8)
    render()
  })

  ensureP5Stage()
}

render()
