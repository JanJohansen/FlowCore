<template>
  <div class="page-layout">
    <header class="header">
      <div class="header-content">
        <NavMenu />
        <slot name="header" />
      </div>
    </header>
    
    <main class="main">
      <slot />
    </main>
    
    <footer class="footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup lang="ts">
import NavMenu from './NavMenu.vue'
</script>

<style>
/* Global styles */
:root {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #cccccc;
  --border-color: #404040;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.5;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

/* Layout styles */
.page-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.header {
  flex: 0 0 auto;
  width: 100%;
  padding: 0;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0 auto;
  width: 100%;
}

.header-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-right: auto;
}

.main {
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.main > * {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 100%;
  padding: 0;
  margin: 0;
}

.footer {
  flex: 0 0 auto;
  width: 100%;
  padding: 0;
  background-color: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.footer-text {
  color: var(--text-secondary);
  text-align: center;
}
</style>
