<template>
	<nav class="nav-menu" ref="menuRef" @mouseenter="openMenu" @mouseleave="closeMenu">
		<div class="dropdown">
			<button class="dropdown-toggle" @click="deprecated - toggleMenu">
				<i class="fa fa-navicon"></i>
				<span class="arrow" :class="{ 'arrow-up': isOpen }">▼</span>
			</button>
			<ul class="dropdown-menu" v-show="isOpen">
				<li><router-link to="/" @click="closeMenu">Home</router-link></li>
				<li><router-link to="/flow" @click="closeMenu">Flow</router-link></li>
				<li><router-link to="/coredb" @click="closeMenu">CoreDB Browser</router-link></li>
				<li><router-link to="/dash-designer" @click="closeMenu">Dash Designer</router-link></li>
				<li><router-link to="/dash-viewer" @click="closeMenu">Dash Viewer</router-link></li>
				<li><router-link to="/component-editor" @click="closeMenu">Component Editor</router-link></li>
			</ul>
		</div>
	</nav>
</template>

<script setup lang="ts">
	import { ref, onMounted, onUnmounted } from "vue"

	const isOpen = ref(false)
	const menuRef = ref<HTMLElement | null>(null)
	const closeTimeout = ref<number | null>(null)

	const toggleMenu = () => {
		isOpen.value = !isOpen.value
	}

	const openMenu = () => {
		if (closeTimeout.value) {
			clearTimeout(closeTimeout.value)
			closeTimeout.value = null
		}
		isOpen.value = true
	}

	const closeMenu = () => {
		closeTimeout.value = window.setTimeout(() => {
			isOpen.value = false
		}, 200) // 200ms delay before closing
	}

	const handleClickOutside = (event: MouseEvent) => {
		if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
			isOpen.value = false
		}
	}

	onMounted(() => {
		document.addEventListener("click", handleClickOutside)
	})

	onUnmounted(() => {
		document.removeEventListener("click", handleClickOutside)
		if (closeTimeout.value) {
			clearTimeout(closeTimeout.value)
		}
	})
</script>

<style scoped>
	.nav-menu {
		position: relative;
	}

	.dropdown-toggle {
		background-color: var(--bg-secondary);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		padding: 0.5rem 1rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border-radius: 4px;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}

	.dropdown-toggle:hover {
		background-color: var(--bg-primary);
	}

	.arrow {
		font-size: 0.8rem;
		transition: transform 0.2s;
	}

	.arrow-up {
		transform: rotate(180deg);
	}

	.dropdown-menu {
		position: absolute;
		top: 100%;
		left: 0;
		background-color: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 4px;
		padding: 0.5rem 0;
		margin-top: 0.25rem;
		min-width: 150px;
		list-style: none;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
		z-index: 1000;
	}

	.dropdown-menu li a {
		display: block;
		padding: 0.5rem 1rem;
		color: var(--text-primary);
		text-decoration: none;
		transition: background-color 0.2s;
	}

	.dropdown-menu li a:hover {
		background-color: var(--bg-primary);
	}

	.dropdown-menu li a.router-link-active {
		background-color: var(--bg-primary);
		font-weight: 500;
	}
</style>
