import type { DebateConfig, DebateEvent } from './types'

const BASE_URL = 'http://localhost:8000'

export async function streamDebate(
  config: DebateConfig,
  onEvent: (event: DebateEvent) => void,
  onDone: () => void,
  onError: (err: string) => void
): Promise<() => void> {
  const controller = new AbortController()

  ;(async () => {
    try {
      const res = await fetch(`${BASE_URL}/debate/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
        signal: controller.signal,
      })

      if (!res.ok) {
        onError(`Server error: ${res.status}`)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          try {
            onEvent(JSON.parse(trimmed) as DebateEvent)
          } catch {
            // skip malformed line
          }
        }
      }
      onDone()
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        onError(err.message ?? 'Unknown error')
      }
    }
  })()

  return () => controller.abort()
}
