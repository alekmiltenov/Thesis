import { useState, useRef, useCallback, useEffect } from 'react'
import './App.css'
import type {
  ViewMode, Theme, DebateStatus, DebateConfig,
  DebateEvent, ChatMessage, VizLane, ParticipantMeta,
} from './types'
import { streamDebate } from './api'
import ConfigPanel from './components/ConfigPanel'
import ChatView from './components/ChatView'
import VisualizationView from './components/VisualizationView'

const VIEWS: { key: ViewMode; label: string }[] = [
  { key: 'chat',          label: 'Chat'      },
  { key: 'split',         label: 'Split'     },
  { key: 'visualization', label: 'Visualize' },
]

function buildLanes(rounds: number, participants: ParticipantMeta[]): VizLane[] {
  const thinkers  = participants.filter(p => p.role_type === 'thinker')
  const reviewers = participants.filter(p => p.role_type === 'reviewer')
  const judges    = participants.filter(p => p.role_type === 'judge')
  const lanes: VizLane[] = []

  for (let r = 1; r <= rounds; r++) {
    if (thinkers.length)
      lanes.push({
        id: `${r}-thinker`, round: r, phase: 'thinker',
        nodes: thinkers.map(p => ({ participantId: p.id, model: p.model, role: p.role, status: 'waiting' })),
      })
    if (reviewers.length)
      lanes.push({
        id: `${r}-reviewer`, round: r, phase: 'reviewer',
        nodes: reviewers.map(p => ({ participantId: p.id, model: p.model, role: p.role, status: 'waiting' })),
      })
    if (r === rounds) {
      if (thinkers.length)
        lanes.push({
          id: `${r}-final_thinker`, round: r, phase: 'final_thinker',
          nodes: thinkers.map(p => ({ participantId: p.id, model: p.model, role: p.role, status: 'waiting' })),
        })
      if (judges.length)
        lanes.push({
          id: `${r}-judge`, round: r, phase: 'judge',
          nodes: judges.map(p => ({ participantId: p.id, model: p.model, role: p.role, status: 'waiting' })),
        })
    }
  }
  return lanes
}

export default function App() {
  const [theme,       setTheme]       = useState<Theme>('light')
  const [viewMode,    setViewMode]    = useState<ViewMode>('chat')
  const [config,      setConfig]      = useState<DebateConfig>({ rounds: 1, participants: [], user_prompt: '' })
  const [messages,    setMessages]    = useState<ChatMessage[]>([])
  const [lanes,       setLanes]       = useState<VizLane[]>([])
  const [status,      setStatus]      = useState<DebateStatus>('idle')
  const [finalAnswer, setFinalAnswer] = useState<string | null>(null)
  const [error,       setError]       = useState<string | null>(null)
  const cancelRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const handleEvent = useCallback((event: DebateEvent) => {
    if (event.type === 'debate_started') {
      setLanes(buildLanes(event.rounds, event.participants))

    } else if (event.type === 'participant_response') {
      setMessages(prev => [...prev, {
        id:          `${event.round}-${event.phase}-${event.participant.id}-${Date.now()}`,
        round:       event.round,
        phase:       event.phase,
        participant: event.participant,
      }])
      setLanes(prev => prev.map(lane =>
        lane.phase === event.phase && lane.round === event.round
          ? {
              ...lane,
              nodes: lane.nodes.map(n =>
                n.participantId === event.participant.id
                  ? { ...n, status: 'done', text: event.participant.text }
                  : n
              ),
            }
          : lane
      ))

    } else if (event.type === 'debate_complete') {
      setFinalAnswer(event.final_answer)
      setStatus('complete')

    } else if (event.type === 'error') {
      setError(event.message)
      setStatus('error')
    }
  }, [])

  const handleStart = useCallback(async () => {
    if (!config.participants.length || !config.user_prompt.trim()) return
    setMessages([])
    setLanes([])
    setFinalAnswer(null)
    setError(null)
    setStatus('running')

    const cancel = await streamDebate(
      config,
      handleEvent,
      () => setStatus(prev => prev === 'running' ? 'complete' : prev),
      (err) => { setError(err); setStatus('error') },
    )
    cancelRef.current = cancel
  }, [config, handleEvent])

  const handleStop = useCallback(() => {
    cancelRef.current?.()
    setStatus('idle')
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-title">
          <span>Thesis</span>
          <span className={`status-dot status-dot--${status}`} />
        </div>

        <div className="view-tabs">
          {VIEWS.map(v => (
            <button
              key={v.key}
              className={`view-tab ${viewMode === v.key ? 'active' : ''}`}
              onClick={() => setViewMode(v.key)}
            >
              {v.label}
            </button>
          ))}
        </div>

        <button className="theme-btn" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? '○' : '●'}
        </button>
      </header>

      <main className="app-main">
        {viewMode === 'chat' && (
          <ChatView messages={messages} finalAnswer={finalAnswer} error={error} status={status} />
        )}
        {viewMode === 'visualization' && (
          <VisualizationView lanes={lanes} status={status} />
        )}
        {viewMode === 'split' && (
          <div className="split-layout">
            <ChatView messages={messages} finalAnswer={finalAnswer} error={error} status={status} />
            <VisualizationView lanes={lanes} status={status} />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <ConfigPanel
          config={config}
          onChange={setConfig}
          onStart={handleStart}
          onStop={handleStop}
          isRunning={status === 'running'}
        />
      </footer>
    </div>
  )
}
