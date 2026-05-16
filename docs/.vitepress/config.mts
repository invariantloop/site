import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Invariant Loop",
  description: "Invariant Loop Site",
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/invariantloop-logo.svg' }]
  ],
  themeConfig: {
    logo: '/invariantloop-logo.svg',
    search: {
      provider: 'local'
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
    ],

    sidebar: [
      {
        text: 'Overview',
        base: '/overview/',
        collapsed: false,
        items: [
          { text: 'Knowledge Graph', link: '/overview' },
        ]
      },
      {
        text: 'Discrete Mathematics',
        base: '/discrete-mathematics/',
        collapsed: false,
        items: [
          {
            text: 'Chapter 1 — Logic & Proofs',
            collapsed: false,
            items: [
              { text: '1. Propositional Logic', link: '/1_1-propositional-logic' },
              { text: '2. Propositional Equivalences', link: '/1_2-propositional-equivalences' },
              { text: '3. Predicates and Quantifier', link: '/1_3-predicates-quantifier' },
              { text: '4. Rule of Inference', link: '/1_4-rule-of-inference' },
              { text: '5. Proof', link: '/1_5-proof' },
            ]
          },
          {
            text: 'Chapter 2 — Sets & Functions',
            collapsed: false,
            items: [
              { text: '1. Set', link: '/2_1-set' },
              { text: '2. Set Operations', link: '/2_2-set-operation' },
              { text: '3. Function', link: '/2_3-function' },
              { text: '4. Sequences & Summations', link: '/2_4-sequence' },
            ]
          },
          {
            text: 'Chapter 3 — Number Theory & Cryptography',
            collapsed: false,
            items: [
              { text: '1. Divisibility and Modular Arithmetic', link: '/4_1-divisibility-and-modular-arithmetic' },
              { text: '2. Integer Representations and Algorithms', link: '/4_2-integer-representations-and-algorithms' },
              { text: '3. Primes and Greatest Common Divisors', link: '/4_3-primes-and-greatest-common-divisors' },
              { text: '4. Solving Congruences', link: '/4_4-solving-congruences' },
              { text: '5. Cryptography', link: '/4_5-cryptography' },
            ]
          },
          {
            text: 'Chapter 4 — Mathematical Induction',
            collapsed: false,
            items: [
              { text: '1. Induction', link: '/5_1-mathematical-induction' },
              { text: '2. Recursion', link: '/5_2-recursion' },
              { text: '3. Program correctness', link: '/5_3-program-correctness' },
            ]
          },
          {
            text: 'Chapter 5 — Relations',
            collapsed: false,
            items: [
              { text: '1. Relations', link: '/9_1-relations' },
              { text: '2. Closures of Relations', link: '/9_4-closures-of-relations' },
              { text: '3. Equivalence Relations', link: '/9_5-equivalence-relations' },
            ]
          },
        ]
      },
      {
        text: 'DSA',
        base: '/dsa/',
        collapsed: false,
        items: [
          { text: 'Red black tree', link: '/red-black-tree' },
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
      message: 'Built with ❤️ and curiosity',
      copyright: `Copyright © ${new Date().getFullYear()} Invariant Loop`
    }
  },
  markdown: {
    math: true
  },
})
