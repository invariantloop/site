<template>
  <div ref="container" class="mermaid"></div>
</template>
<script setup>
import mermaid from 'mermaid'
import { onMounted, ref, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'

const props = defineProps({
  code: {
    type: String,
    required: true
  }
})

const container = ref(null)
const route = useRoute()

async function render() {
  if (!container.value) return

  try {
    container.value.innerHTML = ''
    const id = 'mermaid-' + Math.random().toString(36).slice(2)

    const result = await mermaid.render(id, props.code)

    container.value.innerHTML = result.svg
  } catch (e) {
    container.value.innerHTML = `<pre>${e.message}</pre>`
    console.error(e)
  }
}

onMounted(async () => {
  mermaid.initialize({
    startOnLoad: false,
    flowchart: {
      curve: 'basis'
    },
    theme: 'base',
    themeVariables: {
      // nền tối nhưng dịu
      background: '#0f172a', // slate-900

      // node
      primaryColor: '#111827', // gần nền
      primaryBorderColor: '#e5e7eb', // xám sáng
      primaryTextColor: '#e5e7eb',

      // text
      textColor: '#e5e7eb',

      // line
      lineColor: '#e5e7eb',

      // label background
      edgeLabelBackground: '#0f172a',

      // font
      fontFamily: 'Times New Roman, serif'
    }
  })
  await nextTick()
  render()
})

watch(() => route.path, async () => {
  await nextTick()
  render()
})
</script>