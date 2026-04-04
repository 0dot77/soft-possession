export function createStrudelSnapshot(sceneState) {
  const level = sceneState.interventionLevel
  const patterns = [
    'rest-heavy ambient pulse',
    'delayed pulse lattice',
    'steady arpeggiated scaffold',
    'stuttered syncopation',
    'driving broken club grid',
    'high-pressure fragmented refrain',
  ]

  return {
    transport: sceneState.isFrozen ? 'paused' : 'ready',
    tempo: sceneState.tempo,
    patternLabel: patterns[level],
    silenceRatio: Number((0.28 - level * 0.036).toFixed(2)),
    subdivision: 1 + level,
  }
}
