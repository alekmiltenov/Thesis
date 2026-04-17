import { useState } from 'react'
import type { VizLane } from '../types'
import './DisagreementMatrix.css'

interface ParticipantSummary {
  id:        number
  model:     string
  role:      string
  responses: { phase: string; round: number; text: string }[]
}

function buildSummaries(lanes: VizLane[]): ParticipantSummary[] {
  const map = new Map<number, ParticipantSummary>()
  for (const lane of lanes) {
    for (const node of lane.nodes) {
      if (!map.has(node.participantId)) {
        map.set(node.participantId, { id: node.participantId, model: node.model, role: node.role, responses: [] })
      }
      if (node.status === 'done' && node.text) {
        map.get(node.participantId)!.responses.push({ phase: lane.phase, round: lane.round, text: node.text })
      }
    }
  }
  return Array.from(map.values())
}

interface CompareState { a: ParticipantSummary; b: ParticipantSummary }

export default function DisagreementMatrix({ lanes }: { lanes: VizLane[] }) {
  const [compare, setCompare] = useState<CompareState | null>(null)
  const participants = buildSummaries(lanes)

  if (participants.length === 0) {
    return (
      <div className="matrix-empty">
        Start a debate to populate the matrix.
      </div>
    )
  }

  return (
    <div className="matrix-view">
      <div className="matrix-hint">Click any cell to compare two participants' responses side by side.</div>
      <div className="matrix-scroll">
        <table className="matrix-table">
          <thead>
            <tr>
              <th className="matrix-corner" />
              {participants.map(p => (
                <th key={p.id} className="matrix-col-header">
                  <div className={`matrix-badge matrix-badge--${p.role}`}>{p.role}</div>
                  <div className="matrix-model-name">{p.model}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {participants.map(rowP => (
              <tr key={rowP.id}>
                <td className="matrix-row-header">
                  <div className={`matrix-badge matrix-badge--${rowP.role}`}>{rowP.role}</div>
                  <div className="matrix-model-name">{rowP.model}</div>
                </td>
                {participants.map(colP => {
                  const isSelf    = rowP.id === colP.id
                  const bothDone  = rowP.responses.length > 0 && colP.responses.length > 0
                  const clickable = !isSelf && bothDone

                  return (
                    <td
                      key={colP.id}
                      className={[
                        'matrix-cell',
                        isSelf    ? 'matrix-cell--self'     : '',
                        clickable ? 'matrix-cell--clickable' : '',
                        !isSelf && !bothDone ? 'matrix-cell--empty' : '',
                      ].join(' ')}
                      onClick={() => clickable && setCompare({ a: rowP, b: colP })}
                      title={clickable ? `Compare ${rowP.model} vs ${colP.model}` : undefined}
                    >
                      {isSelf   ? <span className="matrix-cell-self">—</span>        :
                       bothDone ? <span className="matrix-cell-icon">⇄</span>        :
                                  <span className="matrix-cell-dot">·</span>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {compare && (
        <div className="matrix-overlay" onClick={() => setCompare(null)}>
          <div className="matrix-modal" onClick={e => e.stopPropagation()}>
            <div className="matrix-modal-header">
              <span className="matrix-modal-title">Response Comparison</span>
              <button className="matrix-modal-close" onClick={() => setCompare(null)}>×</button>
            </div>
            <div className="matrix-modal-body">
              {[compare.a, compare.b].map((p, i) => (
                <div key={i} className="matrix-col">
                  <div className={`matrix-col-header-bar matrix-col-header-bar--${p.role}`}>
                    <span className={`matrix-badge matrix-badge--${p.role}`}>{p.role}</span>
                    <span className="matrix-col-model">{p.model}</span>
                  </div>
                  <div className="matrix-col-responses">
                    {p.responses.map((r, j) => (
                      <div key={j} className="matrix-response">
                        <div className="matrix-response-meta">{r.phase} · Round {r.round}</div>
                        <p className="matrix-response-text">{r.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
