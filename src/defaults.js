export const defaultP5Code = `function sketch(p, scope) {
  p.setup = () => {
    const canvas = p.createCanvas(scope.width, scope.height)
    canvas.parent(scope.mount)
    p.noStroke()
  }

  p.windowResized = () => {
    p.resizeCanvas(scope.mount.clientWidth, scope.mount.clientHeight)
  }

  p.draw = () => {
    const s = scope.state
    const [bg, mid, accent] = s.palette
    p.background(bg)

    const density = Math.floor(16 + s.density * 48)
    for (let i = 0; i < density; i += 1) {
      const x = p.noise(i * 0.1, p.frameCount * 0.01) * p.width
      const y = p.noise(i * 0.2, p.frameCount * 0.015) * p.height
      const size = 4 + p.noise(i, p.frameCount * 0.02) * (12 + s.chaos * 30)
      p.fill(i % 2 === 0 ? mid : accent)
      p.circle(x, y, size)
    }

    p.stroke(accent)
    p.noFill()
    p.beginShape()
    for (let x = 0; x < p.width; x += 12) {
      const y = p.height * 0.5 + p.sin(x * 0.01 + p.frameCount * 0.03) * (20 + s.chaos * 70)
      p.vertex(x, y)
    }
    p.endShape()
    p.noStroke()
  }
}`

export const defaultStrudelCode = `note("c3 e3 g3 a3")
  .fast(2)
  .gain(0.7)
  .room(0.2)`
