import { useState, useRef, useEffect } from 'react'
import type { VizLane, VizNode, Phase, DebateStatus } from '../types'
import './VisualizationView.css'

interface Props {
  lanes:  VizLane[]
  status: DebateStatus
}

const PHASE_LABELS: Record<Phase, string> = {
  thinker:       'Thinkers',
  reviewer:      'Reviewers',
  final_thinker: 'Final Thinkers',
  judge:         'Judge',
}

// First lane where any node is still waiting = active lane
function getActiveLaneIndex(lanes: VizLane[]): number {
  return lanes.findIndex(lane => lane.nodes.some(n => n.status === 'waiting'))
}

interface ModalState {
  node: VizNode
  lane: VizLane
}

// ── Viz type selector (extensible) ────────
type VizType = 'pipeline'
const VIZ_TYPES: { key: VizType; label: string }[] = [
  { key: 'pipeline', label: 'Pipeline' },
  // future: { key: 'matrix', label: 'Disagreement Matrix' }
]

export default function VisualizationView({ lanes, status }: Props) {
  const [vizType, setVizType] = useState<VizType>('pipeline')
  const [modal, setModal] = useState<ModalState | null>(null)
  const feedRef = useRef<HTMLDivElement>(null)

  const activeLaneIndex = getActiveLaneIndex(lanes)

  // Scroll to bottom as new lanes appear
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [lanes.length])

  // Close modal on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setModal(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="viz-view">
      <div className="viz-header">
        <div className="viz-type-tabs">
          {VIZ_TYPES.map(vt => (
            <button
              key={vt.key}
              className={`viz-type-tab ${vizType === vt.key ? 'active' : ''}`}
              onClick={() => setVizType(vt.key)}
            >
              {vt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="viz-feed" ref={feedRef}>
        {lanes.length === 0 && (
          <div className="viz-empty">
            {status === 'running'
              ? <><div className="viz-spinner" /><span>Initializing…</span></>
              : <span>Start a debate to see the visualization.</span>
            }
          </div>
        )}

        {lanes.map((lane, laneIdx) => {
          const isActive = laneIdx === activeLaneIndex
          const isPast   = activeLaneIndex === -1 || laneIdx < activeLaneIndex
          const showRoundLabel = laneIdx === 0 || lanes[laneIdx - 1].round !== lane.round

          return (
            <div key={lane.id} className="viz-lane-wrapper">
              {showRoundLabel && (
                <div className="viz-round-label">
                  <span>Round {lane.round}</span>
                </div>
              )}

              <div className={`viz-lane ${isActive ? 'viz-lane--active' : ''} ${isPast ? 'viz-lane--past' : ''}`}>
                <div className="viz-lane-title">{PHASE_LABELS[lane.phase]}</div>
                <div className="viz-nodes">
                  {lane.nodes.map(node => {
                    const nodeState =
                      node.status === 'done' ? 'done' :
                      isActive                ? 'running' : 'pending'

                    return (
                      <div
                        key={node.participantId}
                        className={`viz-node viz-node--${nodeState} viz-node--${node.role}`}
                        onClick={() => node.status === 'done' && setModal({ node, lane })}
                        role={node.status === 'done' ? 'button' : undefined}
                        tabIndex={node.status === 'done' ? 0 : undefined}
                        onKeyDown={e => e.key === 'Enter' && node.status === 'done' && setModal({ node, lane })}
                        title={node.status === 'done' ? 'View response' : undefined}
                      >
                        <div className="viz-node-dot" />
                        <div className="viz-node-info">
                          <span className="viz-node-role">{node.role}</span>
                          <span className="viz-node-model">{node.model}</span>
                        </div>
                        {node.status === 'done' && <span className="viz-node-check">✓</span>}
                      </div>
                    )
                  })}
                </div>
              </div>

              {laneIdx < lanes.length - 1 && (
                <div className="viz-connector">
                  <div className="viz-connector-line" />
                  <div className="viz-connector-arrow">▼</div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {modal && (
        <div className="viz-modal-overlay" onClick={() => setModal(null)}>
          <div className="viz-modal" onClick={e => e.stopPropagation()}>
            <div className="viz-modal-header">
              <span className={`viz-modal-role viz-modal-role--${modal.node.role}`}>
                {modal.node.role}
              </span>
              <span className="viz-modal-model">{modal.node.model}</span>
              <span className="viz-modal-phase">
                {PHASE_LABELS[modal.lane.phase]} · Round {modal.lane.round}
              </span>
              <button className="viz-modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <div className="viz-modal-body">
              <p className="viz-modal-text">{modal.node.text}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
