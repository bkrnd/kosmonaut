interface ChatMessage {
  timestamp: Date;
  senderId: string;
  text: string;
}

const chatHistory: ChatMessage[] = []

function addMessageToHistory(senderId: string, text: string) {
  const message: ChatMessage = {
    timestamp: new Date(),
    senderId,
    text,
  }
  chatHistory.push(message)
}

export default defineWebSocketHandler({
  open(peer) {
    peer.subscribe('chat')
    console.log(peer.id, 'connected')
    peer.send(JSON.stringify({ type: 'welcome', senderId: peer.id }))
    peer.send(JSON.stringify({ type: 'history', messages: chatHistory }))
  },
  message(peer, message) {
    const data = JSON.parse(message.toString())
    if (data.type === 'message' && typeof data.text === 'string' && data.text.trim() !== '') {
      addMessageToHistory(peer.id, data.text.trim())
      peer.publish('chat', JSON.stringify({ type: 'message', text: data.text.trim(), isTyping: false, senderId: peer.id }))
    } else if (data.type === 'typing' && typeof data.isTyping === 'boolean') {
      peer.publish('chat', JSON.stringify({ type: 'typing', isTyping: data.isTyping, senderId: peer.id }))
    }
  },
  close(peer) {
    peer.unsubscribe('chat')
  },
})