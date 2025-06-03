<template>
	<div v-if="visible" class="io-tooltip" :style="style">
		<div class="tooltip-content">
			<div v-if="content">
				<div v-for="(value, key) in content" :key="key" class="tooltip-row">
					<span class="tooltip-key">{{ key }}:</span>
					<span class="tooltip-value">{{ formatValue(value) }}</span>
				</div>
			</div>
			<div v-else>No metadata available</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	const props = defineProps<{
		visible: boolean
		content: Record<string, any> | null
		style: Record<string, string>
	}>()

	// Format values for display in tooltip
	function formatValue(value: any): string {
		if (value === null || value === undefined) return "-"

		if (typeof value === "object") {
			return JSON.stringify(value)
		}

		return String(value)
	}
</script>

<style scoped>
	.io-tooltip {
		position: fixed; /* Change from absolute to fixed */
		background-color: #1a1a1a;
		border: 1px solid #555;
		border-radius: 4px;
		padding: 8px;
		font-size: 12px;
		z-index: 1000;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		min-width: 150px;
		max-width: 250px;
		pointer-events: none; /* Prevent tooltip from interfering with mouse events */
	}

	.tooltip-content {
		position: relative;
		z-index: 2;
	}

	.tooltip-row {
		margin-bottom: 4px;
		display: flex;
		flex-wrap: wrap;
	}

	.tooltip-key {
		font-weight: bold;
		color: #aaa;
		margin-right: 5px;
		min-width: 60px;
	}

	.tooltip-value {
		color: #fff;
		word-break: break-word;
	}
</style>
