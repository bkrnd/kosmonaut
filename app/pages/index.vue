<script setup lang="ts">

</script>

<template>
  <div class="main">
    <div class="chat-window">
      <Chat />
    </div>
  </div>
</template>

<style scoped>
.main {
  position: relative;
  min-height: 100vh;
  width: 100%;
}
.chat-window {
  position: absolute;
  right: 0;
  bottom: 0;
  width: min(400px, 100%);
  height: min(600px, 50%);
  border: 1px solid #f0f0f0;
  border-top-left-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
</style>