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
      { text: 'DSA', link: '/dsa/red-black-tree' }
    ],

    sidebar: [
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
