let strudelModulePromise = null
let strudelState = {
  started: false,
  transport: 'idle',
  pattern: null,
  lastError: null,
}

async function loadStrudel() {
  if (!strudelModulePromise) {
    strudelModulePromise = import('@strudel/web')
  }
  return strudelModulePromise
}

function buildPattern(mod, patternSource) {
  const fn = new Function(...Object.keys(mod), `return (${patternSource});`)
  return fn(...Object.values(mod))
}

export async function startStrudel(patternSource) {
  try {
    const mod = await loadStrudel()
    if (!strudelState.started) {
      await mod.samples({
        bd: ['bd/BT0AADA.wav'],
        sd: ['sd/rytm-01-classic.wav'],
        hh: ['hh/000_hh3closedhh.wav'],
        cp: ['cp/000_cp.wav'],
      }, 'github:tidalcycles/dirt-samples')
      strudelState.started = true
    }

    if (typeof mod.silence === 'function') {
      mod.silence()
    }

    const repl = mod.webaudioRepl()
    const pattern = buildPattern(mod, patternSource)
    if (pattern?.play) {
      pattern.play({ repl })
    }

    strudelState.transport = 'playing'
    strudelState.pattern = patternSource
    strudelState.lastError = null
    return { ok: true, transport: strudelState.transport }
  } catch (error) {
    console.error(error)
    strudelState.lastError = error instanceof Error ? error.message : String(error)
    strudelState.transport = 'error'
    return { ok: false, transport: strudelState.transport, error: strudelState.lastError }
  }
}

export async function stopStrudel() {
  try {
    const mod = await loadStrudel()
    if (typeof mod.silence === 'function') {
      mod.silence()
    }
    strudelState.transport = 'stopped'
    return { ok: true, transport: strudelState.transport }
  } catch (error) {
    console.error(error)
    strudelState.lastError = error instanceof Error ? error.message : String(error)
    strudelState.transport = 'error'
    return { ok: false, transport: strudelState.transport, error: strudelState.lastError }
  }
}

export function getStrudelRuntimeState() {
  return { ...strudelState }
}
