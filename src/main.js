import './style.css'
import { createCodeEditor } from './editorRuntime'
import { defaultP5Code, defaultStrudelCode } from './defaults'
import { destroyP5Sketch, runP5Sketch } from './p5Runtime'
import { getStrudelRuntimeState, startStrudel, stopStrudel } from './strudelRuntime'

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
  isFrozen: false,
  strudelStatus: 'idle',
  strudelError: null,
  p5Error: null,
  autoCycleSeconds: 10,
  autoMutationCount: 0,
  lastAutoMutationAt: null,
  activity: ['System initialized.', 'Editors ready.', 'Live coding mode enabled.'],
}

const appState = {
  p5Code: defaultP5Code,
  strudelCode: defaultStrudelCode,
}

const interventionLabels = ['Observe', 'Suggest', 'Assist', 'Guide', 'Perform', 'Possess']
const sections = ['drift', 'build', 'fracture', 'recovery', 'surge', 'afterglow']
const motions = ['still', 'pulse', 'glide', 'shiver', 'erratic', 'flood']

let editorsMounted = false
let p5Editor = null
let strudelEditor = null
let autoLoopHandle = null

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
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

function syncStateForLevel(level) {
  const normalized = level / 5
  sceneState.interventionLevel = level
  sceneState.tempo = Math.round(96 + normalized * 54)
  sceneState.density = clamp(0.24 + normalized * 0.56, 0, 1)
  sceneState.chaos = clamp(0.08 + normalized * 0.72, 0, 1)
  sceneState.repetition = clamp(0.82 - normalized * 0.44, 0, 1)
  sceneState.section = sections[level]
  sceneState.motion = motions[level]
  sceneState.palette = generatePalette(level)
}

function appendActivity(message) {
  sceneState.activity.unshift(message)
  sceneState.activity = sceneState.activity.slice(0, 10)
}

async function executeP5() {
  const mount = document.querySelector('#p5-stage')
  if (!mount) return

  try {
    mount.innerHTML = ''
    await runP5Sketch({
      mount,
      source: appState.p5Code,
      scope: {
        mount,
        width: mount.clientWidth,
        height: mount.clientHeight,
        state: sceneState,
      },
    })
    sceneState.p5Error = null
    appendActivity('p5 sketch executed')
  } catch (error) {
    console.error(error)
    sceneState.p5Error = error instanceof Error ? error.message : String(error)
    appendActivity(`p5 error · ${sceneState.p5Error}`)
  }

  renderRuntimeBadges()
}

async function toggleStrudel() {
  const runtime = getStrudelRuntimeState()
  let result

  if (runtime.transport === 'playing') {
    result = await stopStrudel()
    appendActivity('Strudel transport stopped')
  } else {
    result = await startStrudel(appState.strudelCode)
    appendActivity(result.ok ? 'Strudel transport started' : `Strudel failed · ${result.error}`)
  }

  sceneState.strudelStatus = result.transport
  sceneState.strudelError = result.error ?? null
  renderRuntimeBadges()
}

function performAutoMutation() {
  if (sceneState.isFrozen) return

  const nextLevel = (sceneState.interventionLevel + 1) % 6
  syncStateForLevel(nextLevel)
  sceneState.autoMutationCount += 1
  sceneState.lastAutoMutationAt = new Date().toLocaleTimeString()
  appendActivity(`Auto mutation #${sceneState.autoMutationCount} · ${sceneState.section}`)
  executeP5()
  renderStaticState()
}

function ensureAutoLoop() {
  if (autoLoopHandle) {
    clearInterval(autoLoopHandle)
  }
  autoLoopHandle = window.setInterval(performAutoMutation, sceneState.autoCycleSeconds * 1000)
}

function renderShell() {
  const app = document.querySelector('#app')
  app.innerHTML = `
    <div class="shell shell--editor">
      <header class="hero hero--compact">
        <div>
          <p class="eyebrow">soft possession</p>
          <h1>Live coding instrument for p5.js + Strudel + Gemma.</h1>
          <p class="lede">Write code directly, then decide how much the system gets to interfere.</p>
        </div>
        <div class="hero-card">
          <span class="hero-card__label">Current scene</span>
          <strong id="scene-title"></strong>
          <span id="scene-subtitle"></span>
        </div>
      </header>

      <main class="workspace">
        <section class="panel control-panel">
          <div class="panel__head">
            <h2>Control surface</h2>
            <span class="badge">live</span>
          </div>

          <label class="prompt">
            <span>Prompt</span>
            <textarea id="prompt-input" rows="3"></textarea>
          </label>

          <div class="slider-wrap">
            <div>
              <span class="label">Intervention</span>
              <strong id="level-label"></strong>
            </div>
            <input id="intervention" type="range" min="0" max="5" step="1" />
            <div class="ticks" id="intervention-ticks"></div>
          </div>

          <div class="slider-wrap">
            <div>
              <span class="label">Autonomy cadence</span>
              <strong id="cadence-label"></strong>
            </div>
            <input id="cycle-seconds" type="range" min="4" max="20" step="1" />
          </div>

          <div class="actions actions--wrap">
            <button id="run-p5">Run p5</button>
            <button id="run-strudel">Start Strudel</button>
            <button id="freeze" class="ghost">Freeze AI</button>
            <button id="reset-stage" class="ghost">Reset p5</button>
          </div>

          <div class="status-grid">
            <div class="mini-card">
              <span>Tempo</span>
              <strong id="tempo-value"></strong>
            </div>
            <div class="mini-card">
              <span>Density</span>
              <strong id="density-value"></strong>
            </div>
            <div class="mini-card">
              <span>Chaos</span>
              <strong id="chaos-value"></strong>
            </div>
            <div class="mini-card">
              <span>Mutations</span>
              <strong id="mutation-value"></strong>
            </div>
          </div>

          <div class="runtime-badges" id="runtime-badges"></div>
        </section>

        <section class="panel editor-panel">
          <div class="panel__head">
            <h2>p5.js</h2>
            <span class="badge">visual</span>
          </div>
          <div class="editor-host" id="p5-editor"></div>
        </section>

        <section class="panel editor-panel">
          <div class="panel__head">
            <h2>Strudel</h2>
            <span class="badge">pattern</span>
          </div>
          <div class="editor-host" id="strudel-editor"></div>
        </section>

        <section class="panel stage-panel">
          <div class="panel__head">
            <h2>Stage</h2>
            <span class="badge">preview</span>
          </div>
          <div class="stage__visual"><div id="p5-stage" class="p5-stage"></div></div>
        </section>

        <section class="panel log-panel">
          <div class="panel__head">
            <h2>Activity</h2>
            <span class="badge">trace</span>
          </div>
          <ol class="activity" id="activity-log"></ol>
        </section>
      </main>
    </div>
  `
}

function renderStaticState() {
  document.querySelector('#scene-title').textContent = sceneState.section
  document.querySelector('#scene-subtitle').textContent = `${sceneState.motion} motion · tempo ${sceneState.tempo}`
  document.querySelector('#prompt-input').value = sceneState.prompt
  document.querySelector('#intervention').value = String(sceneState.interventionLevel)
  document.querySelector('#cycle-seconds').value = String(sceneState.autoCycleSeconds)
  document.querySelector('#level-label').textContent = `${sceneState.interventionLevel} · ${interventionLabels[sceneState.interventionLevel]}`
  document.querySelector('#cadence-label').textContent = `${sceneState.autoCycleSeconds}s · ${sceneState.isFrozen ? 'paused' : 'active'}`
  document.querySelector('#tempo-value').textContent = String(sceneState.tempo)
  document.querySelector('#density-value').textContent = sceneState.density.toFixed(2)
  document.querySelector('#chaos-value').textContent = sceneState.chaos.toFixed(2)
  document.querySelector('#mutation-value').textContent = String(sceneState.autoMutationCount)
  document.querySelector('#run-strudel').textContent = sceneState.strudelStatus === 'playing' ? 'Stop Strudel' : 'Start Strudel'
  document.querySelector('#freeze').textContent = sceneState.isFrozen ? 'Resume AI' : 'Freeze AI'
  document.querySelector('#intervention-ticks').innerHTML = interventionLabels
    .map((label, index) => `<span ${index === sceneState.interventionLevel ? 'class="active"' : ''}>${label}</span>`)
    .join('')
  document.querySelector('#activity-log').innerHTML = sceneState.activity.map((item) => `<li>${item}</li>`).join('')
}

function renderRuntimeBadges() {
  const runtime = getStrudelRuntimeState()
  const badges = [
    `p5 ${sceneState.p5Error ? 'error' : 'ready'}`,
    `strudel ${runtime.transport}`,
    sceneState.lastAutoMutationAt ? `last auto ${sceneState.lastAutoMutationAt}` : 'no auto mutations yet',
  ]

  if (sceneState.p5Error) badges.push(`p5: ${sceneState.p5Error}`)
  if (sceneState.strudelError) badges.push(`strudel: ${sceneState.strudelError}`)

  document.querySelector('#runtime-badges').innerHTML = badges.map((item) => `<span>${item}</span>`).join('')
}

function bindControls() {
  document.querySelector('#prompt-input').addEventListener('change', (event) => {
    sceneState.prompt = event.target.value
    appendActivity(`Intent updated · ${sceneState.prompt}`)
    renderStaticState()
  })

  document.querySelector('#intervention').addEventListener('input', (event) => {
    syncStateForLevel(Number(event.target.value))
    appendActivity(`Intervention ${sceneState.interventionLevel} · ${sceneState.section}`)
    executeP5()
    renderStaticState()
  })

  document.querySelector('#cycle-seconds').addEventListener('input', (event) => {
    sceneState.autoCycleSeconds = Number(event.target.value)
    appendActivity(`Autonomy cadence set to ${sceneState.autoCycleSeconds}s`)
    ensureAutoLoop()
    renderStaticState()
  })

  document.querySelector('#run-p5').addEventListener('click', () => {
    executeP5()
  })

  document.querySelector('#run-strudel').addEventListener('click', async () => {
    await toggleStrudel()
    renderStaticState()
  })

  document.querySelector('#freeze').addEventListener('click', () => {
    sceneState.isFrozen = !sceneState.isFrozen
    appendActivity(sceneState.isFrozen ? 'Freeze engaged' : 'Resume engaged')
    renderStaticState()
  })

  document.querySelector('#reset-stage').addEventListener('click', () => {
    destroyP5Sketch()
    executeP5()
  })
}

function mountEditors() {
  if (editorsMounted) return

  p5Editor = createCodeEditor({
    parent: document.querySelector('#p5-editor'),
    doc: appState.p5Code,
    onChange: (value) => {
      appState.p5Code = value
    },
  })

  strudelEditor = createCodeEditor({
    parent: document.querySelector('#strudel-editor'),
    doc: appState.strudelCode,
    onChange: (value) => {
      appState.strudelCode = value
    },
  })

  editorsMounted = true
}

function init() {
  syncStateForLevel(sceneState.interventionLevel)
  renderShell()
  bindControls()
  mountEditors()
  ensureAutoLoop()
  renderStaticState()
  renderRuntimeBadges()
  executeP5()
}

init()
