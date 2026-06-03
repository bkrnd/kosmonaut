<script lang="ts" setup>
import { useIsTyping } from '@/composables/useIsTyping'


const { isTyping, setTyping, clearTyping } = useIsTyping(3000)

const timeline = ref<TimelineEntry[]>([])
let myUserId: UserId = ''
const messageInput = ref('')

const showNewMessageNotification = ref(false)

// List of user that are typing, in correct order (first is the oldest)
const whoIsTyping = ref(new Set<UserId>())
const whoIsTypingArray = computed(() => Array.from(whoIsTyping.value))

const { send, open, close } = useWebSocket('/ws/chat', {
  immediate: false,
  async onMessage(ws, event) {
    const data: ServerEvent = typeof event.data === 'string' ? JSON.parse(event.data) : JSON.parse(await event.data.text())

    switch (data.type) {
      case 'welcome':
        myUserId = data.userId
        break
      case 'timeline':
        timeline.value.push(...data.entries)
        break
      case 'entry_created':
        timeline.value.push(data.entry)
        break
      case 'typing':
        data.isTyping ?
          whoIsTyping.value.add(data.userId)
          :
          whoIsTyping.value.delete(data.userId)
        break
    }
  },
})

function sendEvent(send: (data: string) => void, event: ClientEvent) {
  send(JSON.stringify(event))
}

function sendMessage() {
  if (messageInput.value.trim() !== '') {
    sendEvent(send, { type: 'send_message', text: messageInput.value })
    clearTyping()
    messageInput.value = ''
  }
}

watch(isTyping, (newValue) => {
  sendEvent(send, { type: 'typing', isTyping: newValue })
})



function getHumanReadableUserId(userId: string) {
  if (userId === myUserId) {
    return 'You'
  }
  return userId.slice(0, 6)
}

function getColorFromUserId(userId: string) {
  if (userId === myUserId) {
    return '#555555'
  }
  let hash = 0
  userId.split('').forEach(char => {
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

watch(timeline, () => {
  stickToBottomIfNeeded()
  if (!isAtBottom()) {
    showNewMessageNotification.value = true
  }
}, { deep: true })

watch(whoIsTypingArray, () => {
  stickToBottomIfNeeded()
})

onMounted(() => { open() })
onUnmounted(() => { close() })
</script>

<template>
  <div>
    <p>Chat</p>
    <ul class="messages" ref="container">
      <li v-for="(entry, index) in timeline" :key="entry.id">
        <template v-if="entry.type === 'message'">
          <span 
            v-if="entry.userId && (index === 0 || timeline[index - 1]?.userId !== entry.userId)"
            :class="entry.userId === myUserId ? 'owned' : ''"
            :style="{ color: getColorFromUserId(entry.userId) }"
          >
            {{ getHumanReadableUserId(entry.userId) }}
          </span>
          <p 
            class="message" :class="{ owned: entry.userId === myUserId }"
            :style="{ backgroundColor: getColorFromUserId(entry.userId) + '30' }"
          >
            {{ entry.text }}
          </p>
        </template>
        <template v-else-if="entry.type === 'user_left' || entry.type === 'user_joined'">
          <span 
            :class="entry.userId === myUserId ? 'owned' : ''"
            :style="{ color: getColorFromUserId(entry.userId) }"
          >
            {{ getHumanReadableUserId(entry.userId) }} {{ entry.type === 'user_joined' ? 'joined' : 'left' }} the chat
          </span>
        </template>
      </li>
      <template v-if="whoIsTyping.size > 0">
        <li v-for="userId in whoIsTypingArray" :key="userId">
          <span
            v-if="timeline.length === 0 || (timeline[timeline.length - 1]?.userId !== userId)"
            :style="{ color: getColorFromUserId(userId) }"
          >
            {{ getHumanReadableUserId(userId) }}
          </span>
          <p class="message" :style="{ backgroundColor: getColorFromUserId(userId) + '50' }">...</p>
        </li>
      </template>
    </ul>
    <form @submit.prevent="sendMessage">
      <div v-if="showNewMessageNotification" class="new-message-notification">
        New message!
      </div>
      <input v-model="messageInput" @input="setTyping(messageInput)" maxlength="2000" placeholder="Type a message..." />
      <button type="submit">Send</button>
    </form>
  </div>
</template>