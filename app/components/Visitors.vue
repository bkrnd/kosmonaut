<script lang="ts" setup>
const visitors = ref(0)
const { open } = useWebSocket('/ws/visitors', {
  immediate: false,
  async onMessage(ws, event) {
    // We parse the number of connected users from the message
    // The message might be a string or a Blob
    visitors.value = parseInt(typeof event.data === 'string' ? event.data : await event.data.text())
  },
})

// We open the connection when the component is mounted
onMounted(() => {
  open()
})
</script>

<template>
  <div>
    <h1>Visitors: {{ visitors }}</h1>
  </div>
</template>