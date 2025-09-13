/**
 * Vulcano AI - Experimental Features
 * Prototypes for organic data visualization and intelligent navigation
 */

class ExperimentalFeatures {
  constructor() {
    this.nodeVizActive = false;
    this.aiVizActive = false;
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.initNodeVisualization();
    this.initAICollaborationViz();
    this.initOrganicNavigation();
  }

  initNodeVisualization() {
    const container = document.getElementById('node-visualization');
    if (!container) return;

    // Add subtle animation to nodes
    const nodes = container.querySelectorAll('.satellite-node');
    nodes.forEach((node, index) => {
      // Orbital animation
      node.style.setProperty('--orbit-delay', `${index * 0.5}s`);
      node.classList.add('orbiting');
    });

    // Add pulsing to central node
    const centralNode = container.querySelector('.central-node');
    if (centralNode) {
      centralNode.classList.add('pulsing');
    }
  }

  initAICollaborationViz() {
    const container = document.getElementById('ai-collaboration');
    if (!container) return;

    // Add data flow animation
    const agents = container.querySelectorAll('.ai-agent');
    agents.forEach((agent, index) => {
      agent.style.setProperty('--agent-delay', `${index * 0.3}s`);
      agent.classList.add('processing');
    });
  }

  initOrganicNavigation() {
    const container = document.getElementById('organic-nav');
    if (!container) return;

    const paths = container.querySelectorAll('.nav-path');
    let currentIndex = 0;

    setInterval(() => {
      paths.forEach(path => path.classList.remove('active'));
      paths[currentIndex].classList.add('active');
      currentIndex = (currentIndex + 1) % paths.length;
    }, 2000);
  }

  activateNodeVisualization() {
    if (this.nodeVizActive) return;

    this.nodeVizActive = true;
    const container = document.getElementById('node-visualization');
    container.classList.add('active-experiment');

    // Create dynamic connections
    this.createDynamicConnections();

    console.log('Node visualization activated');
  }

  createDynamicConnections() {
    const container = document.getElementById('node-visualization');
    const central = container.querySelector('.central-node');
    const satellites = container.querySelectorAll('.satellite-node');

    satellites.forEach((satellite, index) => {
      const line = document.createElement('div');
      line.className = 'dynamic-connection';
      line.style.setProperty('--connection-index', index);
      container.appendChild(line);
    });
  }

  activateAICollaborationViz() {
    if (this.aiVizActive) return;

    this.aiVizActive = true;
    const container = document.getElementById('ai-collaboration');
    container.classList.add('active-experiment');

    // Simulate real-time AI collaboration
    this.simulateAICollaboration();

    console.log('AI collaboration visualization activated');
  }

  simulateAICollaboration() {
    const agents = document.querySelectorAll('.ai-agent');

    const simulateActivity = () => {
      const randomAgent = agents[Math.floor(Math.random() * agents.length)];
      randomAgent.classList.add('active-processing');

      setTimeout(() => {
        randomAgent.classList.remove('active-processing');
      }, 1500);
    };

    // Run simulation every 2 seconds
    setInterval(simulateActivity, 2000);
  }

  showNodeCode() {
    const codeModal = this.createCodeModal(`
// Node Visualization System
class NodeSystem {
  constructor(data) {
    this.nodes = this.processData(data);
    this.connections = this.calculateConnections();
  }

  processData(articles) {
    return articles.map(article => ({
      id: article.id,
      title: article.title,
      topics: article.topics,
      relevance: article.relevance,
      position: this.calculatePosition(article),
      connections: this.findRelated(article)
    }));
  }

  calculatePosition(article) {
    // Gravitational positioning based on semantic similarity
    const angle = Math.random() * Math.PI * 2;
    const distance = 100 + (10 - article.relevance) * 20;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance
    };
  }

  render() {
    // SVG-based organic visualization
    this.createNodes();
    this.createConnections();
    this.addInteractivity();
  }
}
    `);

    document.body.appendChild(codeModal);
  }

  createCodeModal(code) {
    const modal = document.createElement('div');
    modal.className = 'code-modal';
    modal.innerHTML = `
      <div class="code-modal-content">
        <div class="code-modal-header">
          <h3>Código del Prototipo</h3>
          <button class="code-modal-close">&times;</button>
        </div>
        <pre><code>${this.escapeHtml(code)}</code></pre>
      </div>
    `;

    modal.querySelector('.code-modal-close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    return modal;
  }

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

// Global functions for HTML onclick handlers
window.activateNodeViz = () => experimentalFeatures.activateNodeVisualization();
window.activateAIViz = () => experimentalFeatures.activateAICollaborationViz();
window.showNodeCode = () => experimentalFeatures.showNodeCode();

// Initialize experimental features
const experimentalFeatures = new ExperimentalFeatures();