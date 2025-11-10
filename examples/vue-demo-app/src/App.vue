<script setup lang="ts">
import DatasetList from './components/DatasetList.vue'
</script>

<template>
  <div class="app">
    <header>
      <h1>DKAN Client Tools - Vue Demo</h1>
      <p>Demonstrating @dkan-client-tools/vue package</p>
    </header>
    <main>
      <DatasetList />
    </main>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
  background: #f5f5f5;
}

.app {
  min-height: 100vh;
}

header {
  background: linear-gradient(135deg, #42b983 0%, #35495e 100%);
  color: white;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
}

header p {
  margin: 0;
  opacity: 0.9;
}

main {
  padding: 2rem 0;
}
</style>
