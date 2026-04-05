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
  activeDock: 'rhythm',
  p5EditorOpen: true,
  p5AutoRun: true,
  activity: ['System initialized.', 'Stage-centered layout active.', 'Live coding mode enabled.'],
}

const appState = {
  p5Code: defaultP5Code,
  strudelCode: defaultStrudelCode,
}

const interventionLabels = ['Observe', 'Suggest', 'Assist', 'Guide', 'Perform', 'Possess']
const sections = ['drift', 'build', 'fracture', 'recovery', 'surge', 'afterglow']
const motions = ['still', 'pulse', 'glide', 'shiver', 'erratic', 'flood']
const dockLabels = {
  rhythm: 'RHYTHM',
  ai: 'AI',
  trace: 'TRACE',
}

let editorsMounted = false
let autoLoopHandle = null
let p5AutoRunTimer = null

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

function scheduleP5AutoRun() {
  if (!sceneState.p5AutoRun) return
  if (p5AutoRunTimer) window.clearTimeout(p5AutoRunTimer)
  p5AutoRunTimer = window.setTimeout(() => {
    executeP5('YOU')
  }, 350)
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
  if (autoLoopHandle) clearInterval(autoLoopHandle)
  autoLoopHandle = window.setInterval(performAutoMutation, sceneState.autoCycleSeconds * 1000)
}

function renderShell() {
  const app = document.querySelector('#app')
  app.innerHTML = `
    <div class="shell shell--stage-first">
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

      <main class="stage-layout">
        <section class="panel stage-panel-main">
          <div class="stage-toolbar">
            <div class="stage-toolbar__left">
              <button id="toggle-p5-editor" class="ghost">Code</button>
              <button id="toggle-p5-autorun" class="ghost">Auto</button>
            </div>
            <div class="stage-toolbar__right" id="runtime-badges"></div>
          </div>

          <div class="stage-surface">
            <div id="p5-stage" class="p5-stage"></div>

            <div class="stage-overlay-info">
              <span id="scene-title"></span>
              <span id="scene-subtitle"></span>
            </div>

            <div class="p5-editor-overlay ${sceneState.p5EditorOpen ? 'is-open' : ''}" id="p5-overlay">
              <div class="p5-editor-overlay__head">
                <span class="code-hint">p5.js live layer</span>
                <button id="close-p5-overlay" class="ghost">Hide</button>
              </div>
              <div id="p5-editor" class="editor-host editor-host--visual"></div>
            </div>
          </div>
        </section>

        <section class="dock-launcher panel">
          <button class="dock-tab ${sceneState.activeDock === 'rhythm' ? 'active' : ''}" data-dock="rhythm">RHYTHM</button>
          <button class="dock-tab ${sceneState.activeDock === 'ai' ? 'active' : ''}" data-dock="ai">AI</button>
          <button class="dock-tab ${sceneState.activeDock === 'trace' ? 'active' : ''}" data-dock="trace">TRACE</button>
        </section>

        <section class="panel dock-panel">
          <div class="dock-panel__head">
            <div>
              <p class="section-tag">${dockLabels[sceneState.activeDock]}</p>
              <h2 id="dock-title"></h2>
            </div>
            <div class="dock-meta" id="dock-meta"></div>
          </div>

          <div id="dock-rhythm" class="dock-view ${sceneState.activeDock === 'rhythm' ? 'active' : ''}">
            <div class="dock-actions">
              <button id="run-strudel-secondary">Start / Stop</button>
              <button id="cycle-down" class="ghost">Slower AI</button>
              <button id="cycle-up" class="ghost">Faster AI</button>
            </div>
            <div id="strudel-editor" class="editor-host editor-host--dock"></div>
          </div>

          <div id="dock-ai" class="dock-view ${sceneState.activeDock === 'ai' ? 'active' : ''}">
            <div class="ai-grid">
              <div class="mini-card">
                <span>Cadence</span>
                <strong id="cadence-label"></strong>
                <input id="cycle-seconds" type="range" min="4" max="20" step="1" />
              </div>
              <div class="mini-card">
                <span>Intervention</span>
                <strong id="intervention-mini-label"></strong>
                <div class="ticks" id="intervention-ticks"></div>
              </div>
              <div class="mini-card">
                <span>Mutations</span>
                <strong id="mutation-value"></strong>
                <small id="last-auto-value"></small>
              </div>
            </div>
          </div>

          <div id="dock-trace" class="dock-view ${sceneState.activeDock === 'trace' ? 'active' : ''}">
            <ol class="activity" id="activity-log"></ol>
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
  document.querySelector('#level-label').textContent = `${sceneState.interventionLevel} · ${interventionLabels[sceneState.interventionLevel]}`
  document.querySelector('#scene-title').textContent = sceneState.section
  document.querySelector('#scene-subtitle').textContent = `${sceneState.motion} · tempo ${sceneState.tempo}`
  document.querySelector('#freeze').textContent = sceneState.isFrozen ? 'Resume AI' : 'Freeze AI'
  document.querySelector('#run-strudel').textContent = sceneState.strudelStatus === 'playing' ? 'Stop Strudel' : 'Start Strudel'
  document.querySelector('#run-strudel-secondary').textContent = sceneState.strudelStatus === 'playing' ? 'Stop' : 'Start'
  document.querySelector('#dock-title').textContent = sceneState.activeDock === 'rhythm' ? 'Strudel deck' : sceneState.activeDock === 'ai' ? 'Gemma agency' : 'Event trace'
  document.querySelector('#dock-meta').textContent = sceneState.activeDock === 'rhythm' ? `transport · ${sceneState.strudelStatus}` : sceneState.activeDock === 'ai' ? `tempo ${sceneState.tempo}` : `${sceneState.activity.length} events`
  document.querySelector('#p5-overlay').classList.toggle('is-open', sceneState.p5EditorOpen)
  document.querySelector('#toggle-p5-autorun').textContent = sceneState.p5AutoRun ? 'Auto on' : 'Auto off'

  document.querySelectorAll('.dock-tab').forEach((button) => {
    button.classList.toggle('active', button.dataset.dock === sceneState.activeDock)
  })
  document.querySelectorAll('.dock-view').forEach((view) => {
    view.classList.toggle('active', view.id === `dock-${sceneState.activeDock}`)
  })

  const badges = [
    `p5 ${sceneState.p5Error ? 'error' : 'ready'}`,
    `strudel ${runtime.transport}`,
    sceneState.lastAutoMutationAt ? `last auto ${sceneState.lastAutoMutationAt}` : 'no auto mutations yet',
  ]
  if (sceneState.p5Error) badges.push(`p5: ${sceneState.p5Error}`)
  if (sceneState.strudelError) badges.push(`strudel: ${sceneState.strudelError}`)
  document.querySelector('#runtime-badges').innerHTML = badges.map((item) => `<span>${item}</span>`).join('')

  const cadence = `${sceneState.autoCycleSeconds}s cadence · ${sceneState.isFrozen ? 'paused' : 'active'}`
  const lastAuto = sceneState.lastAutoMutationAt ?? 'not yet'
  const miniIntervention = `${sceneState.interventionLevel} · ${interventionLabels[sceneState.interventionLevel]}`

  const cadenceLabel = document.querySelector('#cadence-label')
  if (cadenceLabel) cadenceLabel.textContent = cadence
  const cycleInput = document.querySelector('#cycle-seconds')
  if (cycleInput) cycleInput.value = String(sceneState.autoCycleSeconds)
  const miniLabel = document.querySelector('#intervention-mini-label')
  if (miniLabel) miniLabel.textContent = miniIntervention
  const mutationValue = document.querySelector('#mutation-value')
  if (mutationValue) mutationValue.textContent = String(sceneState.autoMutationCount)
  const lastAutoValue = document.querySelector('#last-auto-value')
  if (lastAutoValue) lastAutoValue.textContent = `last · ${lastAuto}`
  const ticks = document.querySelector('#intervention-ticks')
  if (ticks) {
    ticks.innerHTML = interventionLabels
      .map((label, index) => `<span ${index === sceneState.interventionLevel ? 'class="active"' : ''}>${label}</span>`)
      .join('')
  }

  const activityLog = document.querySelector('#activity-log')
  if (activityLog) {
    activityLog.innerHTML = sceneState.activity.map((item) => `<li>${item}</li>`).join('')
  }
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

  document.querySelector('#run-p5').addEventListener('click', () => executeP5('YOU'))
  document.querySelector('#run-strudel').addEventListener('click', async () => toggleStrudel())
  document.querySelector('#run-strudel-secondary').addEventListener('click', async () => toggleStrudel())

  document.querySelector('#freeze').addEventListener('click', () => {
    sceneState.isFrozen = !sceneState.isFrozen
    appendActivity(sceneState.isFrozen ? 'Freeze engaged' : 'Resume engaged', 'YOU')
    renderPanels()
  })

  document.querySelector('#toggle-p5-editor').addEventListener('click', () => {
    sceneState.p5EditorOpen = !sceneState.p5EditorOpen
    renderPanels()
  })

  document.querySelector('#toggle-p5-autorun').addEventListener('click', () => {
    sceneState.p5AutoRun = !sceneState.p5AutoRun
    renderPanels()
  })

  document.querySelector('#close-p5-overlay').addEventListener('click', () => {
    sceneState.p5EditorOpen = false
    renderPanels()
  })

  document.querySelectorAll('.dock-tab').forEach((button) => {
    button.addEventListener('click', () => {
      sceneState.activeDock = button.dataset.dock
      renderPanels()
    })
  })

  document.querySelector('#cycle-down').addEventListener('click', () => {
    sceneState.autoCycleSeconds = clamp(sceneState.autoCycleSeconds + 1, 4, 20)
    ensureAutoLoop()
    renderPanels()
  })

  document.querySelector('#cycle-up').addEventListener('click', () => {
    sceneState.autoCycleSeconds = clamp(sceneState.autoCycleSeconds - 1, 4, 20)
    ensureAutoLoop()
    renderPanels()
  })

  document.addEventListener('input', (event) => {
    if (event.target?.id === 'cycle-seconds') {
      sceneState.autoCycleSeconds = Number(event.target.value)
      ensureAutoLoop()
      renderPanels()
    }
  })
}

function mountEditors() {
  if (editorsMounted) return

  createCodeEditor({
    parent: document.querySelector('#p5-editor'),
    doc: appState.p5Code,
    mode: 'overlay',
    onChange: (value) => {
      appState.p5Code = value
      scheduleP5AutoRun()
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
