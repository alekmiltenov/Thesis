import { useEffect, useRef } from 'react'
import type { ChatMessage, DebateStatus, Phase } from '../types'
import './ChatView.css'

interface Props {
  messages:    ChatMessage[]
  finalAnswer: string | null
  error:       string | null
  status:      DebateStatus
}

const PHASE_LABELS: Record<Phase, string> = {
  thinker:       'Thinkers',
  reviewer:      'Reviewers',
  final_thinker: 'Final Thinkers',
  judge:         'Judge',
}

const ROLE_COLORS: Record<string, string> = {
  solver:    'var(--c-solver)',
  explorer:  'var(--c-explorer)',
  critic:    'var(--c-critic)',
  validator: 'var(--c-validator)',
  judge:     'var(--c-judge)',
}

// Group messages → Map<round, Map<phase, ChatMessage[]>>
function groupMessages(messages: ChatMessage[]) {
  const rounds = new Map<number, Map<Phase, ChatMessage[]>>()
  for (const msg of messages) {
    if (!rounds.has(msg.round)) rounds.set(msg.round, new Map())
    const phases = rounds.get(msg.round)!
    if (!phases.has(msg.phase)) phases.set(msg.phase, [])
    phases.get(msg.phase)!.push(msg)
  }
  return rounds
}

export default function ChatView({ messages, finalAnswer, error, status }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, finalAnswer])

  const grouped = groupMessages(messages)

  const isEmpty = messages.length === 0 && !error

  return (
    <div className="chat-view">
      {isEmpty && (
        <div className="chat-empty">
          {status === 'running'
            ? <><div className="chat-spinner" /><span>Waiting for first response…</span></>
            : <span>Configure participants below and start a debate.</span>
          }
        </div>
      )}

      <div className="chat-feed">
        {Array.from(grouped.entries()).map(([round, phases]) => (
          <div key={round} className="chat-round">
            <div className="chat-round-divider">
              <span>Round {round}</span>
            </div>

            {Array.from(phases.entries()).map(([phase, msgs]) => (
              <div key={phase} className="chat-phase-group">
                <div className="chat-phase-label">{PHASE_LABELS[phase]}</div>
                {msgs.map(msg => (
                  <div
                    key={msg.id}
                    className={`chat-message ${msg.phase === 'judge' ? 'chat-message--judge' : ''}`}
                  >
                    <div
                      className="chat-message-dot"
                      style={{ background: ROLE_COLORS[msg.participant.role] ?? 'var(--text-muted)' }}
                    />
                    <div className="chat-message-body">
                      <div className="chat-message-meta">
                        <span
                          className="chat-message-role"
                          style={{ color: ROLE_COLORS[msg.participant.role] }}
                        >
                          {msg.participant.role}
                        </span>
                        <span className="chat-message-model">{msg.participant.model}</span>
                      </div>
                      <p className="chat-message-text">{msg.participant.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}

        {finalAnswer && (
          <div className="chat-final-answer">
            <div className="chat-final-label">Final Answer</div>
            <p className="chat-final-text">{finalAnswer}</p>
          </div>
        )}

        {error && (
          <div className="chat-error">Error: {error}</div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
