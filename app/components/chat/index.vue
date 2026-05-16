<script lang="ts" setup>
import { useIsTyping } from '@/composables/useIsTyping'
const mySenderId = ref<string>('')
const messages = ref<{ text: string; senderId?: string; type?: 'message' | 'connection'; }[]>([])
const message = ref('')
const { isTyping, setTyping, clearTyping } = useIsTyping(3000)
const whoIsTyping = ref('')
const showNewMessageNotification = ref(false)

const { send, open, close } = useWebSocket('/ws/chat', {
  immediate: false,
  async onMessage(ws, event) {
    const messageData = typeof event.data === 'string' ? JSON.parse(event.data) : JSON.parse(await event.data.text())
    if (messageData.type === 'message') {
      messages.value.push({ text: messageData.text, senderId: messageData.senderId, type: messageData.type })
      whoIsTyping.value = messageData.isTyping ? messageData.senderId : ''
    } else if (messageData.type === 'typing') {
      whoIsTyping.value = messageData.isTyping ? messageData.senderId : ''
    } else if (messageData.type === 'history') {
      messages.value = messageData.messages.map((msg: { text: string; senderId: string }) => ({
        text: msg.text,
        senderId: msg.senderId,
        type: msg.type || 'message',
      }))
    } else if (messageData.type === 'welcome') {
      mySenderId.value = messageData.senderId
    } else if (messageData.type === 'connection') {
      messages.value.push({ text: messageData.text, senderId: messageData.senderId, type: messageData.type })
    }
  },
})

function sendMessage() {
  if (message.value.trim() !== '') {
    messages.value.push({ text: `${message.value}`, senderId: mySenderId.value })
    send(
      JSON.stringify({ type: 'message', text: message.value, isTyping: false })
    )
    clearTyping()
    message.value = ''
  }
}

watch(isTyping, (newValue) => {
  send(JSON.stringify({ type: 'typing', isTyping: newValue }))
})

onMounted(() => { open() })
onUnmounted(() => { close() })

function getHumanReadableSenderId(senderId: string) {
  if (senderId === mySenderId.value) {
    return 'You'
  }
  return senderId.slice(0, 6)
}

function getColorFromSenderId(senderId: string) {
  if (senderId === mySenderId.value) {
    return '#555555'
  }
  let hash = 0
  senderId.split('').forEach(char => {
    hash = char.charCodeAt(0) + ((hash << 5) - hash)
  })
  let colour = '#'
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff
    colour += value.toString(16).padStart(2, '0')
  }
  return colour
}

const container = ref<HTMLUListElement | null>(null)
const { arrivedState } = useScroll(container)

function isAtBottom() {
  if (!container.value) return true
  const { scrollTop, scrollHeight, clientHeight } = container.value
  return scrollTop + clientHeight >= scrollHeight - 10
}

async function stickToBottomIfNeeded() {
  const shouldStick = isAtBottom()
  await nextTick()
  if (shouldStick && container.value) {
    container.value.scrollTop = container.value.scrollHeight
  }
}

watch(() => arrivedState.bottom, (atBottom) => {
  if (atBottom) {
    showNewMessageNotification.value = false
  }
})

watch(messages, () => {
  stickToBottomIfNeeded()
  if (!isAtBottom()) {
    showNewMessageNotification.value = true
  }
}, { deep: true })

watch(whoIsTyping, () => {
  stickToBottomIfNeeded()
})
</script>

<template>
  <div>
    <p>Chat</p>
    <ul class="messages" ref="container">
      <li v-for="(message, index) in messages" :key="index">
        <span 
          v-if="message.senderId && (index === 0 || messages[index - 1].senderId !== message.senderId)"
          :class="message.senderId === mySenderId ? 'owned' : ''"
          :style="{ color: getColorFromSenderId(message.senderId) }"
        >
          {{ getHumanReadableSenderId(message.senderId) }}
        </span>
        <p 
          class="message" :class="{ owned: message.senderId === mySenderId }"
          :style="{ backgroundColor: getColorFromSenderId(message.senderId) + '30' }"
        >
          {{ message.text }}
        </p>
      </li>
      <li v-if="whoIsTyping && whoIsTyping !== mySenderId">
        <span
          v-if="messages.length === 0 || whoIsTyping !== messages[messages.length - 1].senderId"
          :style="{ color: getColorFromSenderId(whoIsTyping) }"
        >
          {{ getHumanReadableSenderId(whoIsTyping) }}
        </span>
        <p class="message" :style="{ backgroundColor: getColorFromSenderId(whoIsTyping) + '50' }">...</p>
      </li>
    </ul>
    <form @submit.prevent="sendMessage">
      <div v-if="showNewMessageNotification" class="new-message-notification">
        New message!
      </div>
      <input v-model="message" @input="setTyping(message)" placeholder="Type a message..." />
      <button type="submit">Send</button>
    </form>
  </div>
</template>

<style scoped>
div {
  height: 100%;
  width: 100%;
  display: flex;
  gap: 1em;
  flex-direction: column;
  align-items: center;
  padding: 0 10px;
}
ul.messages {
  padding: 0;
  width: min(600px, 100%);
  flex-grow: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #cbcbcb #ffffff;
  display: flex;
  flex-direction: column;
}
ul.messages > :first-child {
  margin-top: auto;
}
li {
  list-style: none;
}
li span {
  margin-block: 0.8em 0.3em;
  line-height: 0.8em;
  margin-left: 0.5em;
  font-size: 0.8em;
}
li p {
  margin: 0;
}
.message {
  font-weight: 300;
  padding: 0.3em 0.5em;
  margin: 0.1em 0;
  border-radius: 5px;
  width: fit-content;
}
p.owned {
  text-align: right;
  margin-left: auto;
}
span.owned {
  display: block;
  text-align: right;
}
form {
  position: relative;
  width: 100%;
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
form input {
  flex-grow: 1;
  padding: 0.5em;
  background-color: #ffffff;
  color: #333333;
  border-radius: 5px;
  border: 1px solid #cccccc;
}
form button {
  padding: 0.5em 1em;
  border: none;
  background-color: #333333;
  color: white;
  cursor: pointer;
  border-radius: 5px;
}
.new-message-notification {
  position: absolute;
  color: #4d4d4d;
  top: -1.1em;
  font-size: 0.8em;
}
</style>