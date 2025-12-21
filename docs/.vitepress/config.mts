import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Invariant Loop",
  description: "Invariant Loop Site",
  themeConfig: {
    search: {
      provider: 'local'
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Foundation', link: '/discrete-mathematics/1_1-propositional-logic' }
    ],

    sidebar: [
      {
        text: 'Discrete mathematics',
        base: '/discrete-mathematics/',
        collapsed: false,
        items: [
          { text: '[1.1] Propositional logic', link: '/1_1-propositional-logic' },
          { text: '[1.2] Propositional Equivalences', link: '/1_2-propositional-equivalences' },
          { text: '[1.3] Predicates and Quantifier', link: '/1_3-predicates-quantifier' },
          { text: '[1.4] Rule of inference', link: '/1_4-rule-of-inference' },
          { text: '[1.5] Proof', link: '/1_5-proof' },
        ]
      },
      {
        text: 'DSA',
        base: '/dsa/',
        collapsed: false,
        items: [
          { text: '[CLRS][13] Red black tree', link: '/red-black-tree' },
        ]
      },
      {
        text: 'Networking',
        base: '/networking/',
        items: [
          { text: 'Transport layer protocol', link: 'transport-layer-protocol' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/invariantloop/site' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 Invariant Loop'
    }
  },
  markdown: {
    math: true
  },
})
