// ---------------------------------------------------------------------------
// Generic WebSocket security primitives.
//
// These are domain-agnostic and shared by every WS route (chat, game, ...).
// Files in server/utils are auto-imported by Nitro, so socket handlers can use
// these without an explicit import. Keep anything chat/game-specific OUT of
// this file — only put things here that any socket would want.
// ---------------------------------------------------------------------------

/**
 * Token-bucket rate limiter. `capacity` is the burst size; `refillPerSec` is
 * how fast tokens come back. Call `tryConsume()` per action.
 */
export class TokenBucket {
  private tokens: number
  private last = Date.now()

  constructor(
    private readonly capacity: number,
    private readonly refillPerSec: number,
  ) {
    this.tokens = capacity
  }

  /** Returns true and consumes a token if one is available, false otherwise. */
  tryConsume(cost = 1): boolean {
    const now = Date.now()
    this.tokens = Math.min(
      this.capacity,
      this.tokens + ((now - this.last) / 1000) * this.refillPerSec,
    )
    this.last = now
    if (this.tokens < cost) return false
    this.tokens -= cost
    return true
  }
}

/**
 * Per-peer state registry. Lazily builds a value (e.g. a set of TokenBuckets)
 * for each peer via `factory`, and must be cleared with `remove(peerId)` on
 * disconnect so the map stays bounded by *live* sockets, not lifetime ones.
 *
 * Each socket route creates its own instance with whatever shape it needs:
 *   const limiters = new PeerRegistry(() => ({ move: new TokenBucket(...) }))
 */
export class PeerRegistry<T> {
  private readonly map = new Map<string, T>()

  constructor(private readonly factory: (peerId: string) => T) {}

  get(peerId: string): T {
    if (!this.map.has(peerId)) {
      this.map.set(peerId, this.factory(peerId))
    }
    return this.map.get(peerId)!
  }

  remove(peerId: string): void {
    this.map.delete(peerId)
  }
}

/**
 * Origin / Cross-Site WebSocket Hijacking check, shared by all sockets.
 * - No Origin header (native clients, load tests): allowed.
 * - ALLOWED_ORIGINS env set: must be in the comma-separated allow-list.
 * - Otherwise: same-origin check against the request Host header.
 */
export function isAllowedOrigin(origin: string | null, host: string | null): boolean {
  if (!origin) return true

  const configured = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean)
  if (configured.length > 0) return configured.includes(origin)

  try {
    return host !== null && new URL(origin).host === host
  } catch {
    return false
  }
}

/** Read a peer's Origin + Host headers in one go (for isAllowedOrigin). */
export function getOriginHost(peer: any): { origin: string | null, host: string | null } {
  return {
    origin: peer?.request?.headers?.get('origin') ?? null,
    host: peer?.request?.headers?.get('host') ?? null,
  }
}

/**
 * Read an incoming frame as a string, rejecting oversized payloads before any
 * parsing work happens. Returns null if the frame exceeds `maxLength`.
 */
export function readFrame(message: { toString(): string }, maxLength: number): string | null {
  const raw = message.toString()
  return raw.length > maxLength ? null : raw
}

/** JSON-encode and send to a single peer; never throws if the peer is gone. */
export function safeSend(peer: any, payload: unknown): void {
  try {
    peer.send(JSON.stringify(payload))
  } catch {
    // peer disconnected mid-send; ignore
  }
}

/** JSON-encode and broadcast to a channel; never throws if the peer is gone. */
export function safePublish(peer: any, channel: string, payload: unknown): void {
  try {
    peer.publish(channel, JSON.stringify(payload))
  } catch {
    // ignore
  }
}
