<template>
	<div class="code-editor">
		<textarea
			ref="textareaRef"
			:value="props.value"
			:readonly="props.readonly"
			@input="handleInput"
			class="code-textarea"
			:placeholder="getPlaceholder()"
		></textarea>
	</div>
</template>

<script setup lang="ts">
	import { ref, watch } from "vue"

	// Props
	interface Props {
		value: string
		language?: string
		readonly?: boolean
	}

	const props = withDefaults(defineProps<Props>(), {
		language: "javascript",
		readonly: false
	})

	// Emits
	const emit = defineEmits<{
		update: [value: string]
	}>()

	// Refs
	const textareaRef = ref<HTMLTextAreaElement | null>(null)

	// Methods
	const handleInput = (event: Event) => {
		const target = event.target as HTMLTextAreaElement
		emit("update", target.value)
	}

	const getPlaceholder = () => {
		switch (props.language) {
			case "vue":
				return "<template>\n  <div>{{ props.text }}</div>\n</template>"
			case "javascript":
				return 'console.log("Hello World");'
			default:
				return "Enter your code here..."
		}
	}

	// Watch for value changes
	watch(
		() => props.value,
		(newValue) => {
			if (textareaRef.value && textareaRef.value.value !== newValue) {
				textareaRef.value.value = newValue
			}
		}
	)
</script>

<style scoped>
	.code-editor {
		width: 100%;
		height: 100%;
		border: 1px solid var(--border-color);
		border-radius: 4px;
		overflow: hidden;
	}

	.code-textarea {
		width: 100%;
		height: 100%;
		border: none;
		outline: none;
		resize: none;
		font-family: "Consolas", "Monaco", "Courier New", monospace;
		font-size: 12px;
		background-color: var(--bg-primary);
		color: var(--text-primary);
		padding: 8px;
		line-height: 1.4;
		tab-size: 2;
	}

	.code-textarea::placeholder {
		color: var(--text-secondary);
		opacity: 0.7;
	}
</style>
