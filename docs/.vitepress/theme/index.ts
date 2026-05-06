import Theme from 'vitepress/theme'
// import 'virtual:group-icons.css'
import './styles.css'
import Layout from './Layout.vue'
import Mermaid from './components/Mermaid.vue'


export default {
  ...Theme,
  Layout,
  enhanceApp({ app }) {
    if (typeof window !== 'undefined') {
      app.component('Mermaid', Mermaid)
    }
  }
}