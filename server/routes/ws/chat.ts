export default defineWebSocketHandler({
  open(peer) {
    // We subscribe to the 'chat' channel
    peer.subscribe('chat')
  },
  message(peer, message) {
    // We publish the message to the 'chat' channel
    peer.publish('chat', message)
  },
  close(peer) {
    peer.unsubscribe('chat')
  },
})