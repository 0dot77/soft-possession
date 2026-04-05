import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'

export function createCodeEditor({ parent, doc, onChange, mode = 'default' }) {
  const minimal = mode === 'overlay'

  const extensions = [
    javascript(),
    oneDark,
    keymap.of([]),
    EditorView.theme({
      '&': {
        height: '100%',
        backgroundColor: 'transparent',
        fontSize: minimal ? '12px' : '13px',
      },
      '.cm-scroller': {
        overflow: 'auto',
        fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
      },
      '.cm-content': {
        padding: minimal ? '0 6px 12px 6px' : '6px 0',
      },
      '.cm-gutters': {
        backgroundColor: minimal ? 'transparent' : 'rgba(255,255,255,0.02)',
        color: minimal ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.35)',
        border: 'none',
      },
      '.cm-activeLineGutter': {
        backgroundColor: minimal ? 'transparent' : 'rgba(255,255,255,0.04)',
      },
      '.cm-activeLine': {
        backgroundColor: minimal ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)',
      },
      '.cm-cursor': {
        borderLeftColor: 'rgba(255,255,255,0.9)',
      },
      '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
        backgroundColor: 'rgba(255,255,255,0.14)',
      },
    }),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange?.(update.state.doc.toString())
      }
    }),
  ]

  if (!minimal) {
    extensions.unshift(lineNumbers())
  } else {
    extensions.unshift(lineNumbers({
      formatNumber: (lineNo) => String(lineNo),
      domEventHandlers: {},
    }))
  }

  const state = EditorState.create({
    doc,
    extensions,
  })

  return new EditorView({
    state,
    parent,
  })
}
