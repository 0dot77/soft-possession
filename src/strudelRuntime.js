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

async function ensureStrudelStarted(mod) {
  if (strudelState.started) return

  await mod.initStrudel({ prebake: async () => {
    await mod.samples(
      {
        bd: ['bd/BT0AADA.wav'],
        sd: ['sd/rytm-01-classic.wav'],
        hh: ['hh/000_hh3closedhh.wav'],
        cp: ['cp/000_cp.wav'],
      },
      'github:tidalcycles/dirt-samples',
    )
  } })

  strudelState.started = true
}

export async function startStrudel(patternSource) {
  try {
    const mod = await loadStrudel()
    await ensureStrudelStarted(mod)

    if (typeof mod.silence === 'function') {
      mod.silence()
    }

    await mod.evaluate(patternSource, true)

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
    strudelState.lastError = null
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
