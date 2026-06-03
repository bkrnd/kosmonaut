<template>
  <div class="min-h-screen bg-[url(/images/background.png)] bg-contain">
    <nav class="bg-gray-800 text-white px-8 py-4 flex items-center justify-between">
      <h1>My Chat App</h1>
      <ul class="flex space-x-4">
        <li>Home</li>
        <li>About</li>
        <li>Contact</li>
      </ul>
    </nav>
    <main class="container mx-auto mt-8 grid gap-8">
      <div class="p-4 bg-white">
        <p>Welcome to the Chat App</p>
        <div>Something</div>
        <div>veery</div>
        <div>important</div>
      </div>
      <div class="p-4 bg-white">
        <Chat />
      </div>
    </main>
  </div>
</template>