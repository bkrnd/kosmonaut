export function useIsTyping(delay = 500) {
  const isTyping = ref(false)
  let typingTimeout: ReturnType<typeof setTimeout> | null = null

  function setTyping(message: string) {
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }
    if (!message || message.trim() === '') {
      isTyping.value = false
      return
    }
    isTyping.value = true
    typingTimeout = setTimeout(() => {
      isTyping.value = false
    }, delay)
  }

  function clearTyping() {
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }
    isTyping.value = false
  }

  onUnmounted(() => {
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }
  })

  return { isTyping, setTyping, clearTyping }
}