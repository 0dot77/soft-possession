import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'

export function createCodeEditor({ parent, doc, onChange }) {
  const state = EditorState.create({
    doc,
    extensions: [
      lineNumbers(),
      javascript(),
      oneDark,
      keymap.of([]),
      EditorView.theme({
        '&': {
          height: '100%',
          backgroundColor: 'transparent',
          fontSize: '13px',
        },
        '.cm-scroller': {
          overflow: 'auto',
          fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
        },
        '.cm-gutters': {
          backgroundColor: 'rgba(255,255,255,0.02)',
          color: 'rgba(255,255,255,0.35)',
          border: 'none',
        },
        '.cm-activeLineGutter': {
          backgroundColor: 'rgba(255,255,255,0.04)',
        },
        '.cm-activeLine': {
          backgroundColor: 'rgba(255,255,255,0.03)',
        },
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange?.(update.state.doc.toString())
        }
      }),
    ],
  })

  return new EditorView({
    state,
    parent,
  })
}
