<script setup lang="ts">
import { Decipheriv } from 'crypto';


</script>

<template>
  <div class="main">
    <nav>
      <h1>My Chat App</h1>
      <ul>
        <li><a href="#">Home</a></li>
        <li><a href="#">About</a></li>
        <li><a href="#">Contact</a></li>
      </ul>
    </nav>
    <div class="card">
      <p>Welcome to the Chat App</p>
      <Decipheriv>Something</Decipheriv>
      <div>veery</div>
      <div>important</div>
    </div>
    <div class="chat-window">
      <Chat />
    </div>
  </div>
</template>

<style scoped>
nav {
  background-color: #f8f9fa;
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  margin-bottom: 160px;
  border-bottom: 1px solid #e0e0e0;
  h1 {
    margin: 0;
    font-size: 1.5em;
    color: #007bff;
  }
  ul {
    list-style: none;
    display: flex;
    gap: 20px;
    margin-left: auto;
    li {
      a {
        text-decoration: none;
        color: #007bff;
        font-weight: 500;
        &:hover {
          color: #0056b3;
        }
      }
    }
  }
}

.card {
  width: min(600px, 100%);
  border: 1px solid #e0e0e0;
  margin: 0 auto;
  background: linear-gradient(135deg, #f8f9fa 0%, #e0e0e0 100%);
  padding: 16px 8px 8px;
  border-radius: 16px;

  p {
    font-size: 16px;
    color: #007bff;
    margin-bottom: 16px;
    padding-inline: 16px;
  }

  div {
    border: 1px solid #e0e0e0;
    background-color: #ffffff;
    color: #000000;
    padding: 8px;
    border-radius: 8px;
    margin-bottom: 8px;
    padding-inline: 16px;
    padding-block: 24px;
  }
  div:last-child {
    margin-bottom: 0;
  }
}

.main {
  position: relative;
  min-height: 100vh;
  width: 100%;
  background-image: url('images/background.png');
  background-size: contain;
}
.chat-window {
  position: absolute;
  right: 0;
  bottom: 0;
  width: min(400px, 100%);
  height: min(600px, 50%);
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
</style>