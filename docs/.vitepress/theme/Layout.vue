<script setup>
import DefaultTheme from 'vitepress/theme'
import KnowledgeGraph from "./components/KnowledgeGraph.vue";
const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #home-hero-after>
      <div class="graph-full">
        <ClientOnly>
          <KnowledgeGraph />
        </ClientOnly>
      </div>
    </template>
  </Layout>
</template>

<style>
.graph-full {
  width: calc(100vw - 48px);
  max-width: 1200px;
  height: 75vh;
  margin: 0 auto 0px;
}
</style>