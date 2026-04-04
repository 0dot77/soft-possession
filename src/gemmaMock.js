const sectionPrompts = {
  drift: 'Lean toward sparse motion, wider silence, and suspended anticipation.',
  build: 'Increase continuity and pressure without losing coherence.',
  fracture: 'Introduce rupture, stutter, asymmetry, and volatile accents.',
  recovery: 'Reduce aggression and let shapes reconnect in softened cycles.',
  surge: 'Push energy forward with sharp momentum and rising density.',
  afterglow: 'Let intensity decay into luminous residue and slow repetition.',
}

const patternBank = {
  drift: 'note("c3 ~ g3 ~").slow(2).room(0.4).gain(0.5)',
  build: 'note("c3 e3 g3 a3").fast(2).gain(0.7).room(0.2)',
  fracture: 'sound("bd [sn cp] hh*3").fast(2).degradeBy(0.25).gain(0.8)',
  recovery: 'note("a3 g3 e3 d3").slow(1.5).room(0.6).gain(0.55)',
  surge: 'sound("bd*2 hh*4 cp").fast(2.5).gain(0.9)',
  afterglow: 'note("c4 g3 e3").slow(3).room(0.8).gain(0.45)',
}

export function createGemmaMockUpdate(sceneState) {
  const section = sceneState.section
  const normalized = sceneState.interventionLevel / 5

  return {
    mode: sceneState.interventionLevel < 2 ? 'suggestion' : 'scene_update',
    intentSummary: sectionPrompts[section],
    text: `Shift toward ${section} with ${sceneState.motion} motion and intervention level ${sceneState.interventionLevel}.`,
    changes: {
      tempo: sceneState.tempo,
      density: Number(sceneState.density.toFixed(2)),
      chaos: Number(sceneState.chaos.toFixed(2)),
      repetition: Number(sceneState.repetition.toFixed(2)),
      motion: sceneState.motion,
      section,
      palette: sceneState.palette,
      strudelPattern: patternBank[section],
      silenceRatio: Number((0.28 - normalized * 0.18).toFixed(2)),
      subdivision: 1 + sceneState.interventionLevel,
    },
  }
}
