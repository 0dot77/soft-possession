import './style.css'

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
  activity: [
    'System initialized.',
    'Gemma adapter pending.',
    'p5.js / Strudel bridge planned.',
  ],
}

const interventionLabels = [
  'Observe',
  'Suggest',
  'Assist',
  'Guide',
  'Perform',
  'Possess',
]

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function interpolateHex(a, b, t) {
  const parse = (hex) => hex.match(/[\da-f]{2}/gi).map((v) => Number.parseInt(v, 16))
  const [ar, ag, ab] = parse(a)
  const [br, bg, bb] = parse(b)
  const mix = (x, y) => Math.round(x + (y - x) * t)
  return `rgb(${mix(ar, br)}, ${mix(ag, bg)}, ${mix(ab, bb)})`
}

function mutateState(level) {
  const normalized = level / 5
  sceneState.interventionLevel = level
  sceneState.tempo = Math.round(96 + normalized * 54)
  sceneState.density = clamp(0.24 + normalized * 0.56, 0, 1)
  sceneState.chaos = clamp(0.08 + normalized * 0.72, 0, 1)
  sceneState.repetition = clamp(0.82 - normalized * 0.44, 0, 1)

  const sections = ['drift', 'build', 'fracture', 'recovery', 'surge', 'afterglow']
  sceneState.section = sections[level]
  sceneState.motion = ['still', 'pulse', 'glide', 'shiver', 'erratic', 'flood'][level]

  sceneState.activity.unshift(
    `Intervention ${level} · ${interventionLabels[level]} · ${sceneState.section}`,
  )
  sceneState.activity = sceneState.activity.slice(0, 8)
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
            <div class="ticks">${interventionLabels.map((label, index) => `<span ${index === sceneState.interventionLevel ? 'class="active"' : ''}>${label}</span>`).join('')}</div>
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
            <div class="orb orb-a"></div>
            <div class="orb orb-b"></div>
            <div class="scan"></div>
          </div>
          <div class="stage__text">
            <h2>Prototype direction</h2>
            <p>
              Next: wire p5.js visuals, Strudel transport, and a Gemma adapter that emits
              structured scene updates instead of freeform text.
            </p>
            <code>{ section: &quot;${sceneState.section}&quot;, motion: &quot;${sceneState.motion}&quot; }</code>
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
}

render()
