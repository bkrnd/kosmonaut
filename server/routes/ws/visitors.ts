export default defineWebSocketHandler({
  open(peer) {
    // We subscribe to the 'chat' channel
    peer.subscribe('chat')
    // We publish the number of connected users to the 'chat' channel
    peer.publish('chat', peer.peers.size)
    // We send the number of connected users to the client
    peer.send(peer.peers.size)
  },
  close(peer) {
    peer.unsubscribe('chat')
    // Wait 500ms before sending the updated locations to the server
    setTimeout(() => {
      peer.publish('chat', peer.peers.size)
    }, 500)
  },
})
