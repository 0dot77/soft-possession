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
  activity: ['System initialized.', 'Hydra-inspired layout active.', 'Live coding mode enabled.'],
}

const appState = {
  p5Code: defaultP5Code,
  strudelCode: defaultStrudelCode,
}

const interventionLabels = ['Observe', 'Suggest', 'Assist', 'Guide', 'Perform', 'Possess']
const sections = ['drift', 'build', 'fracture', 'recovery', 'surge', 'afterglow']
const motions = ['still', 'pulse', 'glide', 'shiver', 'erratic', 'flood']

let editorsMounted = false
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

function appendActivity(message, actor = 'SYSTEM') {
  sceneState.activity.unshift(`${actor} · ${message}`)
  sceneState.activity = sceneState.activity.slice(0, 12)
}

async function executeP5(actor = 'YOU') {
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
    appendActivity('p5 sketch executed', actor)
  } catch (error) {
    console.error(error)
    sceneState.p5Error = error instanceof Error ? error.message : String(error)
    appendActivity(`p5 error · ${sceneState.p5Error}`, 'SYSTEM')
  }

  renderPanels()
}

async function toggleStrudel() {
  const runtime = getStrudelRuntimeState()
  let result

  if (runtime.transport === 'playing') {
    result = await stopStrudel()
    appendActivity('Strudel transport stopped', 'YOU')
  } else {
    result = await startStrudel(appState.strudelCode)
    appendActivity(result.ok ? 'Strudel transport started' : `Strudel failed · ${result.error}`, result.ok ? 'YOU' : 'SYSTEM')
  }

  sceneState.strudelStatus = result.transport
  sceneState.strudelError = result.error ?? null
  renderPanels()
}

function performAutoMutation() {
  if (sceneState.isFrozen) return

  const nextLevel = (sceneState.interventionLevel + 1) % 6
  syncStateForLevel(nextLevel)
  sceneState.autoMutationCount += 1
  sceneState.lastAutoMutationAt = new Date().toLocaleTimeString()
  appendActivity(`Auto mutation #${sceneState.autoMutationCount} · ${sceneState.section}`, 'GEMMA')
  executeP5('GEMMA')
  renderPanels()
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
    <div class="shell shell--hydra">
      <header class="topbar panel">
        <div class="topbar__brand">
          <p class="eyebrow">soft possession</p>
          <h1>p5 + Strudel + Gemma</h1>
        </div>
        <div class="topbar__center">
          <label class="prompt-inline">
            <span>PROMPT</span>
            <input id="prompt-input" type="text" />
          </label>
          <div class="agency-strip">
            <span>AGENCY</span>
            <input id="intervention" type="range" min="0" max="5" step="1" />
            <strong id="level-label"></strong>
          </div>
        </div>
        <div class="topbar__actions">
          <button id="freeze" class="ghost">Freeze AI</button>
          <button id="run-strudel" class="ghost">Start Strudel</button>
          <button id="run-p5">Run p5</button>
        </div>
      </header>

      <main class="hydra-layout">
        <section class="panel visual-panel">
          <div class="visual-panel__head">
            <div>
              <p class="section-tag">VISUAL</p>
              <h2>p5.js sketch</h2>
            </div>
            <div class="panel-actions">
              <button id="reset-stage" class="ghost">Reset</button>
            </div>
          </div>

          <div class="visual-stack">
            <div class="editor-frame">
              <div id="p5-editor" class="editor-host"></div>
            </div>
            <div class="stage-frame">
              <div class="stage-overlay">
                <span id="scene-title"></span>
                <span id="scene-subtitle"></span>
              </div>
              <div id="p5-stage" class="p5-stage"></div>
            </div>
          </div>
        </section>

        <aside class="panel side-panel">
          <div class="side-block">
            <p class="section-tag">SCENE</p>
            <div class="metric-list">
              <div><span>tempo</span><strong id="tempo-value"></strong></div>
              <div><span>density</span><strong id="density-value"></strong></div>
              <div><span>chaos</span><strong id="chaos-value"></strong></div>
              <div><span>mutations</span><strong id="mutation-value"></strong></div>
            </div>
          </div>

          <div class="side-block">
            <p class="section-tag">GEMMA</p>
            <div class="agency-status">
              <strong id="cadence-label"></strong>
              <input id="cycle-seconds" type="range" min="4" max="20" step="1" />
              <div class="ticks" id="intervention-ticks"></div>
            </div>
          </div>

          <div class="side-block">
            <p class="section-tag">RUNTIME</p>
            <div class="runtime-badges" id="runtime-badges"></div>
          </div>

          <div class="side-block side-block--log">
            <p class="section-tag">TRACE</p>
            <ol class="activity" id="activity-log"></ol>
          </div>
        </aside>

        <section class="panel rhythm-panel">
          <div class="rhythm-panel__head">
            <div>
              <p class="section-tag">RHYTHM</p>
              <h2>Strudel deck</h2>
            </div>
            <div class="transport-strip">
              <span id="transport-state"></span>
              <button id="run-strudel-secondary" class="ghost">Toggle</button>
            </div>
          </div>
          <div class="editor-frame editor-frame--rhythm">
            <div id="strudel-editor" class="editor-host"></div>
          </div>
        </section>
      </main>
    </div>
  `
}

function renderPanels() {
  const runtime = getStrudelRuntimeState()
  sceneState.strudelStatus = runtime.transport
  sceneState.strudelError = runtime.lastError

  document.querySelector('#prompt-input').value = sceneState.prompt
  document.querySelector('#intervention').value = String(sceneState.interventionLevel)
  document.querySelector('#cycle-seconds').value = String(sceneState.autoCycleSeconds)
  document.querySelector('#level-label').textContent = `${sceneState.interventionLevel} · ${interventionLabels[sceneState.interventionLevel]}`
  document.querySelector('#scene-title').textContent = sceneState.section
  document.querySelector('#scene-subtitle').textContent = `${sceneState.motion} · tempo ${sceneState.tempo}`
  document.querySelector('#tempo-value').textContent = String(sceneState.tempo)
  document.querySelector('#density-value').textContent = sceneState.density.toFixed(2)
  document.querySelector('#chaos-value').textContent = sceneState.chaos.toFixed(2)
  document.querySelector('#mutation-value').textContent = String(sceneState.autoMutationCount)
  document.querySelector('#cadence-label').textContent = `${sceneState.autoCycleSeconds}s cadence · ${sceneState.isFrozen ? 'paused' : 'active'}`
  document.querySelector('#freeze').textContent = sceneState.isFrozen ? 'Resume AI' : 'Freeze AI'
  document.querySelector('#run-strudel').textContent = sceneState.strudelStatus === 'playing' ? 'Stop Strudel' : 'Start Strudel'
  document.querySelector('#run-strudel-secondary').textContent = sceneState.strudelStatus === 'playing' ? 'Stop' : 'Start'
  document.querySelector('#transport-state').textContent = `transport · ${sceneState.strudelStatus}`

  document.querySelector('#intervention-ticks').innerHTML = interventionLabels
    .map((label, index) => `<span ${index === sceneState.interventionLevel ? 'class="active"' : ''}>${label}</span>`)
    .join('')

  document.querySelector('#activity-log').innerHTML = sceneState.activity.map((item) => `<li>${item}</li>`).join('')

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
    appendActivity(`Intent updated · ${sceneState.prompt}`, 'YOU')
    renderPanels()
  })

  document.querySelector('#intervention').addEventListener('input', (event) => {
    syncStateForLevel(Number(event.target.value))
    appendActivity(`Intervention ${sceneState.interventionLevel} · ${sceneState.section}`, 'YOU')
    executeP5('YOU')
    renderPanels()
  })

  document.querySelector('#cycle-seconds').addEventListener('input', (event) => {
    sceneState.autoCycleSeconds = Number(event.target.value)
    appendActivity(`Autonomy cadence set to ${sceneState.autoCycleSeconds}s`, 'YOU')
    ensureAutoLoop()
    renderPanels()
  })

  document.querySelector('#run-p5').addEventListener('click', () => {
    executeP5('YOU')
  })

  document.querySelector('#run-strudel').addEventListener('click', async () => {
    await toggleStrudel()
  })

  document.querySelector('#run-strudel-secondary').addEventListener('click', async () => {
    await toggleStrudel()
  })

  document.querySelector('#freeze').addEventListener('click', () => {
    sceneState.isFrozen = !sceneState.isFrozen
    appendActivity(sceneState.isFrozen ? 'Freeze engaged' : 'Resume engaged', 'YOU')
    renderPanels()
  })

  document.querySelector('#reset-stage').addEventListener('click', () => {
    destroyP5Sketch()
    executeP5('YOU')
  })
}

function mountEditors() {
  if (editorsMounted) return

  createCodeEditor({
    parent: document.querySelector('#p5-editor'),
    doc: appState.p5Code,
    onChange: (value) => {
      appState.p5Code = value
    },
  })

  createCodeEditor({
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
  renderPanels()
  executeP5('SYSTEM')
}

init()
