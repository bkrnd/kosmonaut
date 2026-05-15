<script lang="ts" setup>
const messages = ref<{ text: string; owned: boolean }[]>([])
const message = ref('')
const isTyping = ref(false)

const { status, data, send, open, close, ws } = useWebSocket('/ws/chat', {
  immediate: false,
  async onMessage(ws, event) {
    // convert the json data
    
    const messageData = typeof event.data === 'string' ? JSON.parse(event.data) : JSON.parse(await event.data.text())
    if (messageData.type === 'message') {
      messages.value.push({ text: messageData.text, owned: false })
      isTyping.value = messageData.isTyping
    } else if (messageData.type === 'typing') {
      isTyping.value = messageData.isTyping
    }
  },
})

function sendMessage() {
  if (message.value.trim() !== '') {
    messages.value.push({ text: `${message.value}`, owned: true })
    send(
      JSON.stringify({ type: 'message', text: message.value, isTyping: false })
    )
    message.value = ''
  }
}

function setTyping(isTyping: boolean) {
  send(
    JSON.stringify({ type: 'typing', isTyping })
  )
}

onMounted(() => {
  open()
})
</script>

<template>
  <div>
    <h1>Chat</h1>
    <form @submit.prevent="sendMessage">
      <input v-model="message" @input="setTyping(true)" @blur="setTyping(false)" placeholder="Type a message..." />
      <button type="submit">Send</button>
    </form>
    <ul>
      <li class="message" v-for="(message, index) in messages" :key="index" :class="{ owned: message.owned }">{{ message.text }}</li>
      <li class="message" v-if="isTyping">...</li>
    </ul>
  </div>
</template>

<style scoped>
ul {
  padding: 0;
  width: min(600px, 100%);
  height: max(300px, 80vh);
  overflow-y: auto;
}
li {
  list-style: none;
}
.message {
  padding: 10px;
  margin: 5px 0;
  background-color: #f6f6f6;
  border-radius: 5px;
  width: fit-content;
}
.owned {
  background-color: #e6d5ff;
  text-align: right;
  margin-left: auto;
}
</style>