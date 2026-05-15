<script lang="ts" setup>
const messages = ref<{ text: string; owned: boolean }[]>([])
const message = ref('')

const { status, data, send, open, close, ws } = useWebSocket('/ws/chat', {
  immediate: false,
  async onMessage(ws, event) {
    // We parse the message from the event
    // The message might be a string or a Blob
    const messageText = typeof event.data === 'string' ? event.data : await event.data.text()
    messages.value.push({ text: messageText, owned: false })
  },
})

function sendMessage() {
  if (message.value.trim() !== '') {
    messages.value.push({ text: `${message.value}`, owned: true })
    send(message.value)
    message.value = ''
  }
}

onMounted(() => {
  open()
})
</script>

<template>
  <div>
    <h1>Chat</h1>
    <form @submit.prevent="sendMessage">
      <input v-model="message" placeholder="Type a message..." />
      <button type="submit">Send</button>
    </form>
    <ul>
      <li class="message" v-for="(message, index) in messages" :key="index" :class="{ owned: message.owned }">{{ message.text }}</li>
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