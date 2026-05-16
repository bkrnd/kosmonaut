const timeline: TimelineEntry[] = []

function addMessageEntry(userId: UserId, text: string): TimelineEntry {
  const entry: MessageEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    type: 'message',
    userId,
    text,
  }
  timeline.push(entry)

  return entry
}

function addConnectionEntry(userId: UserId, connectionType: 'user_joined' | 'user_left'): TimelineEntry {
  const entry: UserJoinedEntry | UserLeftEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    type: connectionType,
    userId,
  }
  timeline.push(entry)
  return entry
}

function sendEvent(peer: any, event: ServerEvent) {
  peer.send(JSON.stringify(event))
}

function publishEvent(peer: any, event: ServerEvent) {
  peer.publish('chat', JSON.stringify(event))
}

export default defineWebSocketHandler({
  open(peer) {
    peer.subscribe('chat')
    console.log(peer.id, 'connected')
    const entry = addConnectionEntry(peer.id, 'user_joined')
    sendEvent(peer, { type: 'welcome', userId: peer.id })
    sendEvent(peer, { type: 'timeline', entries: timeline })
    publishEvent(peer, { type: 'entry_created', entry })
  },
  message(peer, message) {
    console.log(peer.id, 'sent message', message.toString())
    const data  = <ClientEvent>JSON.parse(message.toString())
    if (data.type === 'send_message' && typeof data.text === 'string' && data.text.trim() !== '') {
      const entry = addMessageEntry(peer.id, data.text.trim())
      sendEvent(peer, { type: 'entry_created', entry })
      publishEvent(peer, { type: 'entry_created', entry })
    } else if (data.type === 'typing' && typeof data.isTyping === 'boolean') {
      publishEvent(peer, { type: 'typing', isTyping: data.isTyping, userId: peer.id })
    }
  },
  close(peer) {
    console.log(peer.id, 'disconnected')
    const entry = addConnectionEntry(peer.id, 'user_left')
    console.table(entry)
    sendEvent(peer, { type: 'entry_created', entry })
    publishEvent(peer, { type: 'entry_created', entry })
    peer.unsubscribe('chat')
  },
})