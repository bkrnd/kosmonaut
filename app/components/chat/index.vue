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
            :class="entry.userId === myUserId ? 'text-primary' : 'text-foreground'"
          >
            {{ getHumanReadableUserId(entry.userId) }}
          </span>
          <p 
            class="message" :class="{ 'text-primary': entry.userId === myUserId }"
          >
            {{ entry.text }}
          </p>
        </template>
        <template v-else-if="entry.type === 'user_left' || entry.type === 'user_joined'">
          <span 
            :class="entry.userId === myUserId ? 'text-primary' : 'text-secondary'"
          >
            {{ getHumanReadableUserId(entry.userId) }} {{ entry.type === 'user_joined' ? 'joined' : 'left' }} the chat
          </span>
        </template>
      </li>
      <template v-if="whoIsTyping.size > 0">
        <li v-for="userId in whoIsTypingArray" :key="userId">
          <span
            v-if="timeline.length === 0 || (timeline[timeline.length - 1]?.userId !== userId)"
          >
            {{ getHumanReadableUserId(userId) }}
          </span>
          <p class="message" :class="userId === myUserId ? 'text-primary' : 'text-secondary'">...</p>
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