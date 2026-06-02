// ---------------------------------------------------------------------------
// Chat socket. Generic socket-security primitives (rate limiting, origin
// checks, safe send) live in server/utils/wsSecurity.ts and are auto-imported.
// This file only contains chat-specific config, state, and event handling.
// ---------------------------------------------------------------------------

const CHANNEL = 'chat'

const LIMITS = {
  /** Max length of a single chat message (characters). */
  MAX_MESSAGE_LENGTH: 2_000,
  /** Hard cap on the size of a single incoming WS frame (characters). */
  MAX_FRAME_LENGTH: 16_000,
  /** Max entries kept in memory; older ones are dropped (ring buffer). */
  MAX_TIMELINE_ENTRIES: 1_000,
  /** Token-bucket rate limits, per peer. */
  MESSAGE_BURST: 5,
  MESSAGE_REFILL_PER_SEC: 2,
  TYPING_BURST: 10,
  TYPING_REFILL_PER_SEC: 5,
} as const

// In-memory chat state.
const timeline: TimelineEntry[] = []

// Per-peer rate limiters, cleared on disconnect (see close()).
const limiters = new PeerRegistry(() => ({
  message: new TokenBucket(LIMITS.MESSAGE_BURST, LIMITS.MESSAGE_REFILL_PER_SEC),
  typing: new TokenBucket(LIMITS.TYPING_BURST, LIMITS.TYPING_REFILL_PER_SEC),
}))

// ---------------------------------------------------------------------------
// Input validation: turn an untrusted frame into a trusted ClientEvent.
// Returns null for anything malformed / unknown / out of bounds.
// ---------------------------------------------------------------------------
function parseClientEvent(raw: string): ClientEvent | null {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null) return null
  const event = data as Record<string, unknown>

  switch (event.type) {
    case 'send_message': {
      if (typeof event.text !== 'string') return null
      const text = event.text.trim()
      if (text === '' || text.length > LIMITS.MAX_MESSAGE_LENGTH) return null
      return { type: 'send_message', text }
    }
    case 'typing': {
      if (typeof event.isTyping !== 'boolean') return null
      return { type: 'typing', isTyping: event.isTyping }
    }
    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Timeline helpers (ring buffer: keep only the most recent N entries)
// ---------------------------------------------------------------------------
function pushEntry(entry: TimelineEntry) {
  timeline.push(entry)
  if (timeline.length > LIMITS.MAX_TIMELINE_ENTRIES) {
    timeline.splice(0, timeline.length - LIMITS.MAX_TIMELINE_ENTRIES)
  }
}

function addMessageEntry(userId: UserId, text: string): TimelineEntry {
  const entry: MessageEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    type: 'message',
    userId,
    text,
  }
  pushEntry(entry)
  return entry
}

function addConnectionEntry(userId: UserId, connectionType: 'user_joined' | 'user_left'): TimelineEntry {
  const entry: UserJoinedEntry | UserLeftEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    type: connectionType,
    userId,
  }
  pushEntry(entry)
  return entry
}

// Typed thin wrappers over the generic safe-send helpers.
function sendEvent(peer: any, event: ServerEvent) {
  safeSend(peer, event)
}
function publishEvent(peer: any, event: ServerEvent) {
  safePublish(peer, CHANNEL, event)
}

// ---------------------------------------------------------------------------
// WebSocket handler
// ---------------------------------------------------------------------------
export default defineWebSocketHandler({
  open(peer) {
    const { origin, host } = getOriginHost(peer)
    if (!isAllowedOrigin(origin, host)) {
      console.warn(peer.id, 'rejected: disallowed origin', origin)
      peer.close(1008, 'Origin not allowed')
      return
    }

    peer.subscribe(CHANNEL)
    console.log(peer.id, 'connected')
    const entry = addConnectionEntry(peer.id, 'user_joined')
    sendEvent(peer, { type: 'welcome', userId: peer.id })
    sendEvent(peer, { type: 'timeline', entries: timeline })
    publishEvent(peer, { type: 'entry_created', entry })
  },

  message(peer, message) {
    const raw = readFrame(message, LIMITS.MAX_FRAME_LENGTH)
    if (raw === null) {
      console.warn(peer.id, 'dropped oversized frame')
      return
    }

    const data = parseClientEvent(raw)
    if (!data) return // malformed / unknown / invalid payload — ignore silently

    const limiter = limiters.get(peer.id)

    if (data.type === 'send_message') {
      if (!limiter.message.tryConsume()) return // rate limited
      const entry = addMessageEntry(peer.id, data.text)
      sendEvent(peer, { type: 'entry_created', entry })
      publishEvent(peer, { type: 'entry_created', entry })
    } else if (data.type === 'typing') {
      if (!limiter.typing.tryConsume()) return // rate limited
      publishEvent(peer, { type: 'typing', isTyping: data.isTyping, userId: peer.id })
    }
  },

  close(peer) {
    console.log(peer.id, 'disconnected')
    limiters.remove(peer.id)
    const entry = addConnectionEntry(peer.id, 'user_left')
    publishEvent(peer, { type: 'entry_created', entry })
    peer.unsubscribe(CHANNEL)
  },

  error(peer, error) {
    console.error(peer?.id, 'websocket error', error)
  },
})
