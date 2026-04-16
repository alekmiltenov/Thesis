import { useRef } from 'react'
import type { DebateConfig, ParticipantConfig, Role } from '../types'
import './ConfigPanel.css'

const MODELS = [
  'gpt-4.1', 'gpt-4.1-mini',
  'claude-sonnet-4-6', 'claude-opus-4-6', 'claude-haiku-4-5',
  'gemini-2.5-pro', 'gemini-2.5-flash',
  'deepseek-chat', 'deepseek-reasoner',
  'llama-3.1-8b-instant', 'llama-3.3-70b-versatile',
]

const ROLES: Role[] = ['solver', 'explorer', 'critic', 'validator', 'judge']

interface Props {
  config:    DebateConfig
  onChange:  (config: DebateConfig) => void
  onStart:   () => void
  onStop:    () => void
  isRunning: boolean
}

export default function ConfigPanel({ config, onChange, onStart, onStop, isRunning }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const addParticipant = () =>
    onChange({ ...config, participants: [...config.participants, { model: 'gpt-4.1', role: 'solver' }] })

  const removeParticipant = (i: number) =>
    onChange({ ...config, participants: config.participants.filter((_, idx) => idx !== i) })

  const updateParticipant = (i: number, patch: Partial<ParticipantConfig>) =>
    onChange({ ...config, participants: config.participants.map((p, idx) => idx === i ? { ...p, ...patch } : p) })

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'
    onChange({ ...config, user_prompt: e.target.value })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isRunning) onStart()
    }
  }

  const canStart = !isRunning && config.participants.length > 0 && config.user_prompt.trim().length > 0

  return (
    <div className="config-panel">
      {config.participants.length > 0 && (
        <div className="config-participants">
          {config.participants.map((p, i) => (
            <div key={i} className={`participant-chip participant-chip--${p.role}`}>
              <select
                value={p.role}
                onChange={e => updateParticipant(i, { role: e.target.value as Role })}
                disabled={isRunning}
                className="chip-select chip-role"
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <span className="chip-sep">·</span>
              <select
                value={p.model}
                onChange={e => updateParticipant(i, { model: e.target.value })}
                disabled={isRunning}
                className="chip-select chip-model"
              >
                {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {!isRunning && (
                <button className="chip-remove" onClick={() => removeParticipant(i)}>×</button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="config-input-row">
        <textarea
          ref={textareaRef}
          className="config-textarea"
          placeholder="Ask anything... (Enter to send, Shift+Enter for newline)"
          value={config.user_prompt}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          disabled={isRunning}
          rows={1}
        />
        <button
          className={`config-send ${isRunning ? 'config-send--stop' : ''}`}
          onClick={isRunning ? onStop : onStart}
          disabled={!isRunning && !canStart}
          title={isRunning ? 'Stop debate' : 'Start debate'}
        >
          {isRunning ? '◼' : '▶'}
        </button>
      </div>

      <div className="config-meta">
        <label className="config-rounds">
          <span>Rounds</span>
          <input
            type="number"
            min={1}
            max={10}
            value={config.rounds}
            onChange={e => onChange({ ...config, rounds: Math.max(1, parseInt(e.target.value) || 1) })}
            disabled={isRunning}
          />
        </label>
        <button
          className="config-add-btn"
          onClick={addParticipant}
          disabled={isRunning}
        >
          + Add participant
        </button>
      </div>
    </div>
  )
}
