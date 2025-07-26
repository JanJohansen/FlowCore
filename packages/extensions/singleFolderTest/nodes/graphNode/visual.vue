<template>
	<flow-node-base :context="props.context">
		<template #body>
			<div class="chart-container">
				<div ref="chartRef" class="chart"></div>
			</div>
		</template>
	</flow-node-base>
</template>

<script setup lang="ts">
	import { ref, onMounted } from "vue"
	import { FlowNodeBase } from "../../../frontend-types"
	import type { ICustomNodeContext, IFlowNodeModel, INodeDefinition } from "../../../frontend-types"
	import * as d3 from "d3"

	const props = defineProps<{
		context: ICustomNodeContext
	}>()

	const chartRef = ref<HTMLElement | null>(null)

	// Stub data for the line chart
	const stubData = [
		{ x: 0, y: 40 },
		{ x: 1, y: 15 },
		{ x: 2, y: 8 },
		{ x: 3, y: 22 },
		{ x: 4, y: 18 },
		{ x: 5, y: 25 },
		{ x: 6, y: 30 },
		{ x: 7, y: 20 },
		{ x: 8, y: 35 },
		{ x: 9, y: 28 },
		{ x: 10, y: 40 }
	]

	onMounted(() => {
		if (!chartRef.value) return

		// Get actual container dimensions
		const containerWidth = chartRef.value.clientWidth
		const containerHeight = chartRef.value.clientHeight

		// Responsive margins based on container size
		const margin = {
			top: Math.max(1, containerHeight * 0.05),
			right: Math.max(2, containerWidth * 0.05),
			bottom: Math.max(5, containerHeight * 0.2),
			left: Math.max(5, containerWidth * 0.15)
		}
		const width = containerWidth - margin.left - margin.right
		const height = containerHeight - margin.top - margin.bottom

		// Skip rendering if dimensions are too small
		if (width <= 0 || height <= 0) return

		// Create SVG
		const svg = d3
			.select(chartRef.value)
			.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`)

		// Create scales
		const xScale = d3
			.scaleLinear()
			.domain(d3.extent(stubData, (d) => d.x) as [number, number])
			.range([0, width])

		const yScale = d3
			.scaleLinear()
			.domain(d3.extent(stubData, (d) => d.y) as [number, number])
			.nice()
			.range([height, 0])

		// Add grid lines (only if chart is large enough)
		if (width > 30 && height > 20) {
			// X grid lines
			svg.append("g")
				.attr("class", "grid")
				.attr("transform", `translate(0,${height})`)
				.call(
					d3
						.axisBottom(xScale)
						.ticks(Math.min(5, width / 20))
						.tickSize(-height)
						.tickFormat(() => "")
				)

			// Y grid lines
			svg.append("g")
				.attr("class", "grid")
				.call(
					d3
						.axisLeft(yScale)
						.ticks(Math.min(5, height / 15))
						.tickSize(-width)
						.tickFormat(() => "")
				)
		}

		// Create line generator
		const line = d3
			.line<{ x: number; y: number }>()
			.x((d) => xScale(d.x))
			.y((d) => yScale(d.y))
			.curve(d3.curveMonotoneX)

		// Add X axis (only if there's enough space)
		if (height > 15) {
			svg.append("g")
				.attr("class", "x-axis")
				.attr("transform", `translate(0,${height})`)
				.call(
					d3
						.axisBottom(xScale)
						.ticks(Math.min(3, width / 15))
						.tickFormat(d3.format("d"))
				)
		}

		// Add Y axis (only if there's enough space)
		if (width > 15) {
			svg.append("g")
				.attr("class", "y-axis")
				.call(
					d3
						.axisLeft(yScale)
						.ticks(Math.min(3, height / 10))
						.tickFormat(d3.format("d"))
				)
		}

		// Add the line
		svg.append("path")
			.datum(stubData)
			.attr("fill", "none")
			.attr("stroke", "#3b82f6")
			.attr("stroke-width", Math.max(1, Math.min(2, width / 100)))
			.attr("d", line)

		// Add dots for data points (only if chart is large enough)
		if (width > 20 && height > 15) {
			const dotRadius = Math.max(1, Math.min(3, width / 50))
			svg.selectAll(".dot")
				.data(stubData)
				.enter()
				.append("circle")
				.attr("class", "dot")
				.attr("cx", (d) => xScale(d.x))
				.attr("cy", (d) => yScale(d.y))
				.attr("r", dotRadius)
				.attr("fill", "#3b82f6")
		}

		// Add axis labels (only if chart is large enough)
		if (width > 40 && height > 30) {
			svg.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", 0 - margin.left)
				.attr("x", 0 - height / 2)
				.attr("dy", "1em")
				.style("text-anchor", "middle")
				.style("font-size", Math.max(8, Math.min(12, width / 20)) + "px")
				.text("Y")

			svg.append("text")
				.attr("transform", `translate(${width / 2}, ${height + margin.bottom})`)
				.style("text-anchor", "middle")
				.style("font-size", Math.max(8, Math.min(12, width / 20)) + "px")
				.text("X")
		}
	})
</script>

<style scoped>
	.chart-container {
		margin-top: 2rem;
		padding: 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 4px;
		background-color: #f9fafb;
	}

	.chart {
		width: 100%;
		height: 200px;
	}

	h2 {
		margin: 0 0 1rem 0;
		color: #374151;
	}

	/* Grid styles */
	:deep(.grid line) {
		stroke: #03173e;
		stroke-dasharray: 2, 2;
		stroke-width: 1;
		opacity: 0.5;
	}

	:deep(.grid path) {
		stroke-width: 0;
	}

	/* Axis styles */
	:deep(.x-axis line),
	:deep(.y-axis line) {
		stroke: #6b7280;
	}

	:deep(.x-axis path),
	:deep(.y-axis path) {
		stroke: #6b7280;
		stroke-width: 1;
	}

	:deep(.x-axis text),
	:deep(.y-axis text) {
		fill: #374151;
		font-size: clamp(6px, 2vw, 10px);
	}
</style>
