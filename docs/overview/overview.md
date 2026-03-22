<script setup>
import KnowledgeGraph from '../.vitepress/theme/components/KnowledgeGraph.vue'
</script>

# Knowledge Graph

An interactive map of concepts and how they connect. Hover over a node to see its description, click to navigate to the topic.

<ClientOnly>
  <div class="kg-wrap">
    <KnowledgeGraph />
  </div>
</ClientOnly>

<style>
.kg-wrap {
  width: 100%;
  height: 75vh;
  margin-top: 1.5rem;
}
</style>
