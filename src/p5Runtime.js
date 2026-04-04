let p5ModulePromise = null
let p5Instance = null

async function loadP5() {
  if (!p5ModulePromise) {
    p5ModulePromise = import('p5')
  }
  return p5ModulePromise
}

export async function runP5Sketch({ mount, source, scope }) {
  const { default: p5 } = await loadP5()

  if (p5Instance) {
    p5Instance.remove()
    p5Instance = null
  }

  const factory = new Function('p', 'scope', `${source}\nreturn typeof sketch === 'function' ? sketch(p, scope) : null`)

  p5Instance = new p5((p) => {
    factory(p, scope)
  }, mount)

  return { ok: true }
}

export function destroyP5Sketch() {
  if (p5Instance) {
    p5Instance.remove()
    p5Instance = null
  }
}
