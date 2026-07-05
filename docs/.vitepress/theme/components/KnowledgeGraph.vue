<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useData } from 'vitepress'

const container = ref(null)
const router    = useRouter()
const { isDark } = useData()
let graphInstance = null
let resizeObserver = null

const GROUP_META = {
  math:    { color: '#3b82f6', glow: '#93c5fd' },
  number:  { color: '#10b981', glow: '#6ee7b7' },
  crypto:  { color: '#8b5cf6', glow: '#c4b5fd' },
  rel:     { color: '#f6b15c', glow: '#fdf7b5' },
  count:   { color: '#ec4899', glow: '#f9a8d4' },
}

// Tooltip state
const tooltip = ref({ visible: false, x: 0, y: 0, node: null })

function updateTooltip(node) {
  tooltip.value.visible = !!node
  tooltip.value.node    = node || null
}

function onMouseMove(e) {
  const rect = container.value.getBoundingClientRect()
  tooltip.value.x = e.clientX - rect.left + 14
  tooltip.value.y = e.clientY - rect.top  - 10
}

onMounted(async () => {
  const { default: ForceGraph } = await import('force-graph')

  // ── Load JSON ──────────────────────────────────────────────────────────────
  const graphData = await fetch('/graph-data.json').then(r => r.json())
  const { nodes, links } = graphData

  // Wait until the container has real dimensions before initialising
  const { width, height } = await new Promise(resolve => {
    resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) {
        resizeObserver.disconnect()
        resizeObserver = null
        resolve({ width, height })
      }
    })
    resizeObserver.observe(container.value)
  })

  console.log('[graph] init size:', width, 'x', height)

  // Pre-compute degree, neighbors and links on each node (same pattern as official example)
  const degreeMap = {}
  nodes.forEach(n => {
    degreeMap[n.id] = 0
    n.neighbors = []
    n.links = []
  })
  links.forEach(l => {
    const a = nodes.find(n => n.id === l.source)
    const b = nodes.find(n => n.id === l.target)
    degreeMap[l.source] = (degreeMap[l.source] || 0) + 1
    degreeMap[l.target] = (degreeMap[l.target] || 0) + 1
    if (a && b) {
      a.neighbors.push(b); b.neighbors.push(a)
      a.links.push(l);     b.links.push(l)
    }
  })

  // val drives force-graph's default hit-detection area
  nodes.forEach(n => { n.val = (degreeMap[n.id] || 1) * 8 })

  // ── Highlight state — store node/link OBJECTS (not IDs) ───────────────────
  const highlightNodes = new Set()
  const highlightLinks = new Set()
  let   hoveredNode    = null

  function updateHighlight(node) {
    highlightNodes.clear()
    highlightLinks.clear()
    hoveredNode = node || null

    if (node) {
      highlightNodes.add(node)
      node.neighbors.forEach(nb  => highlightNodes.add(nb))
      node.links.forEach(link    => highlightLinks.add(link))
    }
  }

  graphInstance = new ForceGraph(container.value)
    .width(width)
    .height(height)
    .backgroundColor('rgba(0,0,0,0)')
    .autoPauseRedraw(false)
    .graphData(graphData)
    .nodeId('id')
    .nodeLabel(() => 'id')
    .enablePointerInteraction(true)
    .nodeRelSize(6)

    // ── Links ──────────────────────────────────────────────────────────────
    .linkColor(link => {
      const isHighlighted = highlightLinks.has(link)
      const hasHighlight  = highlightLinks.size > 0
      if (hasHighlight && !isHighlighted)
        return isDark.value ? 'rgba(51,65,85,0.15)' : 'rgba(148,163,184,0.15)'
      return isDark.value ? 'rgba(51,65,85,0.7)' : 'rgba(100,116,139,0.6)'
    })
    .linkWidth(link => highlightLinks.has(link) ? 2.5 : 1.2)
    .linkDirectionalParticles(3)
    .linkDirectionalParticleWidth(link => highlightLinks.has(link) ? 5 : 2.5)
    .linkDirectionalParticleColor(link => {
      const src = typeof link.source === 'object' ? link.source : nodes.find(n => n.id === link.source)
      const baseColor = src ? GROUP_META[src.group]?.color : '#3b82f6'
      const glowColor = src ? GROUP_META[src.group]?.glow  : '#60a5fa'
      return isDark.value ? glowColor : baseColor + 'aa'
    })
    .linkDirectionalParticleSpeed(0.005)

    // ── Nodes ──────────────────────────────────────────────────────────────
    .nodeCanvasObject((node, ctx, globalScale) => {
      if (node.x == null || node.y == null || !isFinite(node.x) || !isFinite(node.y)) return

      const meta          = GROUP_META[node.group] || GROUP_META.math
      const deg           = degreeMap[node.id] || 1
      const radius        = 6 + deg * 1.8
      const isHover       = hoveredNode === node
      const isHighlighted = highlightNodes.has(node)
      const hasHighlight  = highlightNodes.size > 0
      const dimmed        = hasHighlight && !isHighlighted

      ctx.globalAlpha = dimmed ? 0.15 : 1

      // Outer glow ring
      const glowRadius = isHover ? radius + 10 : radius + 5
      if (!dimmed) {
        const gradient = ctx.createRadialGradient(node.x, node.y, radius * 0.5, node.x, node.y, glowRadius)
        gradient.addColorStop(0, meta.glow + '44')
        gradient.addColorStop(1, meta.glow + '00')
        ctx.beginPath()
        ctx.arc(node.x, node.y, glowRadius, 0, 2 * Math.PI)
        ctx.fillStyle = gradient
        ctx.fill()
      }

      // Glow shadow
      ctx.shadowColor = meta.glow
      ctx.shadowBlur  = isDark.value ? (isHover ? 24 : 12) : (isHover ? 10 : 4)

      // Main circle
      const grad = ctx.createRadialGradient(node.x - radius * 0.3, node.y - radius * 0.3, radius * 0.1, node.x, node.y, radius)
      grad.addColorStop(0, meta.glow)
      grad.addColorStop(0.5, meta.color)
      grad.addColorStop(1, meta.color + 'bb')
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = grad
      ctx.fill()

      // Border ring
      ctx.strokeStyle = isHover ? (isDark.value ? '#ffffff' : '#334155') : meta.color
      ctx.lineWidth   = isHover ? 1.8 : 1
      ctx.stroke()
      ctx.shadowBlur  = 0

      // Label
      const fontSize = Math.max(11 / globalScale, 2.5)
      ctx.font        = `${isHover ? 600 : 400} ${fontSize}px Inter, system-ui, sans-serif`
      ctx.textAlign   = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle   = isDark.value
        ? (isHover ? '#f1f5f9' : '#94a3b8')
        : (isHover ? '#1e293b' : '#475569')
      ctx.fillText(node.label, node.x, node.y + radius + 3 / globalScale)

      ctx.globalAlpha = 1
    })
    .nodePointerAreaPaint((node, color, ctx) => {
      if (node.x == null || !isFinite(node.x)) return
      ctx.beginPath()
      ctx.arc(node.x, node.y, 50, 0, 2 * Math.PI) // 50px test radius
      ctx.fillStyle = color
      ctx.fill()
    })

    // ── Interactions ───────────────────────────────────────────────────────
    .onNodeHover(node => {
      console.log('[hover]', node ? node.id : null)
      container.value.style.cursor = node ? 'pointer' : 'default'
      updateHighlight(node)
      updateTooltip(node)
    })
    .onNodeClick(node => {
      console.log('[click]', node.id, node.link)
      if (node.link) router.go(node.link)
    })
    // ── Fix dragged nodes ──────────────────────────────────────────────────
    .onNodeDragEnd(node => {
      node.fx = node.x
      node.fy = node.y
    })

  // Forces
  graphInstance.d3Force('charge').strength(-300)
  graphInstance.d3Force('link').distance(80)
  graphInstance.d3Force('center', null)
  const d3 = await import('d3-force')
  graphInstance.d3Force('collision', d3.forceCollide(node => {
    const deg = degreeMap[node.id] || 1
    return 6 + deg * 1.8 + 16
  }))

  // Pin nodes and fit view once simulation fully settles
  graphInstance
    .cooldownTicks(100)
    .onEngineStop(() => {
      graphInstance.graphData().nodes.forEach(node => {
        node.fx = node.x
        node.fy = node.y
      })
      graphInstance.zoomToFit(400, 60)
    })
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  if (graphInstance) {
    try { graphInstance._destructor?.() } catch {}
  }
})
</script>

<template>
  <div ref="container" class="graph-wrap" @mousemove="onMouseMove">

    <Transition name="tip">
      <div
        v-if="tooltip.visible && tooltip.node"
        class="tooltip"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        <div class="tip-title" :style="{ color: GROUP_META[tooltip.node.group]?.glow }">
          {{ tooltip.node.label }}
        </div>
        <div class="tip-desc">{{ tooltip.node.desc }}</div>
        <div v-if="tooltip.node.link" class="tip-hint">Click to open →</div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.graph-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  box-shadow:
    0 0 0 1px rgba(109, 142, 255, 0.06),
    0 32px 64px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.tooltip {
  position: absolute;
  pointer-events: none;
  background: rgba(2, 6, 23, 0.92);
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 8px 12px;
  font-family: Inter, system-ui, sans-serif;
  backdrop-filter: blur(10px);
  max-width: 200px;
  z-index: 10;
}

.tip-title {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 3px;
}

.tip-desc {
  font-size: 11px;
  color: #64748b;
  line-height: 1.4;
}

.tip-hint {
  font-size: 10px;
  color: #475569;
  margin-top: 4px;
}

.tip-enter-active, .tip-leave-active { transition: opacity 0.15s, transform 0.15s; }
.tip-enter-from, .tip-leave-to { opacity: 0; transform: translateY(4px); }
</style>
