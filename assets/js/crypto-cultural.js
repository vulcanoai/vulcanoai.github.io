/**
 * Vulcano AI - Cultural Crypto Gateway
 * Vector mathematics meets Latin American digital culture
 */

class CryptoCulturalGateway {
  constructor() {
    this.vectorField = null;
    this.geometricLogo = null;
    this.economicData = {
      usd: { rate: 0, trend: 'neutral' },
      sol: { rate: 0, trend: 'neutral' },
      btc: { rate: 0, trend: 'neutral' },
      computePower: 0
    };

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
    this.vectorField = document.getElementById('vector-field');
    this.geometricLogo = document.getElementById('geometric-logo');

    if (this.vectorField) {
      this.createVectorField();
    }

    if (this.geometricLogo) {
      this.createGeometricLogo();
    }

    this.initEconomicDashboard();
    this.initComputationVisualization();
  }

  createVectorField() {
    // Create mathematical vector field based on logo geometry
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', '0 0 800 600');
    svg.style.position = 'absolute';

    // Generate vector field based on logo's elliptical orbits
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 800;
      const y = Math.random() * 600;

      // Calculate vector direction based on elliptical field
      const centerX = 400;
      const centerY = 300;
      const dx = x - centerX;
      const dy = y - centerY;
      const angle = Math.atan2(dy, dx);

      // Create vector line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x);
      line.setAttribute('y1', y);
      line.setAttribute('x2', x + Math.cos(angle + Math.PI/3) * 20);
      line.setAttribute('y2', y + Math.sin(angle + Math.PI/3) * 20);
      line.setAttribute('stroke', 'currentColor');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('opacity', '0.3');

      svg.appendChild(line);
    }

    this.vectorField.appendChild(svg);
    this.animateVectorField(svg);
  }

  animateVectorField(svg) {
    let rotation = 0;
    const animate = () => {
      rotation += 0.5;
      svg.style.transform = `rotate(${rotation}deg)`;
      requestAnimationFrame(animate);
    };
    animate();
  }

  createGeometricLogo() {
    // Recreate logo with pure mathematical precision
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '120');
    svg.setAttribute('height', '120');
    svg.setAttribute('viewBox', '0 0 64 64');

    // Central circle (the volcano core)
    const centralCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    centralCircle.setAttribute('cx', '32');
    centralCircle.setAttribute('cy', '32');
    centralCircle.setAttribute('r', '20');
    centralCircle.setAttribute('fill', 'none');
    centralCircle.setAttribute('stroke', 'currentColor');
    centralCircle.setAttribute('stroke-width', '1.5');
    svg.appendChild(centralCircle);

    // Elliptical orbits - Group 1 (30° rotation)
    const group1 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group1.setAttribute('transform', 'rotate(30 32 32)');

    const radii = [6, 12, 18];
    radii.forEach(ry => {
      const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      ellipse.setAttribute('cx', '32');
      ellipse.setAttribute('cy', '32');
      ellipse.setAttribute('rx', '20');
      ellipse.setAttribute('ry', ry);
      ellipse.setAttribute('fill', 'none');
      ellipse.setAttribute('stroke', 'currentColor');
      ellipse.setAttribute('stroke-width', '1.5');
      ellipse.setAttribute('opacity', '0.8');
      group1.appendChild(ellipse);
    });
    svg.appendChild(group1);

    // Elliptical orbits - Group 2 (60° rotation)
    const group2 = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group2.setAttribute('transform', 'rotate(60 32 32)');

    radii.forEach(ry => {
      const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      ellipse.setAttribute('cx', '32');
      ellipse.setAttribute('cy', '32');
      ellipse.setAttribute('rx', '20');
      ellipse.setAttribute('ry', ry);
      ellipse.setAttribute('fill', 'none');
      ellipse.setAttribute('stroke', 'currentColor');
      ellipse.setAttribute('stroke-width', '1.5');
      ellipse.setAttribute('opacity', '0.8');
      group2.appendChild(ellipse);
    });
    svg.appendChild(group2);

    svg.style.color = 'var(--brand)';
    svg.style.filter = 'drop-shadow(0 0 20px rgba(255,90,42,0.3))';

    this.geometricLogo.appendChild(svg);
    this.animateGeometricLogo(group1, group2);
  }

  animateGeometricLogo(group1, group2) {
    let rotation1 = 30;
    let rotation2 = 60;

    const animate = () => {
      rotation1 += 0.3;
      rotation2 += 0.2;

      group1.setAttribute('transform', `rotate(${rotation1} 32 32)`);
      group2.setAttribute('transform', `rotate(${rotation2} 32 32)`);

      requestAnimationFrame(animate);
    };
    animate();
  }

  initEconomicDashboard() {
    // Simulate real economic data (in production, this would fetch from APIs)
    this.updateEconomicIndicators();

    // Update every 30 seconds
    setInterval(() => {
      this.updateEconomicIndicators();
    }, 30000);
  }

  updateEconomicIndicators() {
    // Simulate realistic LATAM economic data
    const variations = {
      usd: this.generateVariation(4200, 200), // Colombian Peso example
      sol: this.generateVariation(165, 15),    // Solana price
      btc: this.generateVariation(43000, 2000), // Bitcoin
      computePower: this.generateVariation(1847, 100) // TFLOPS for LATAM
    };

    // Update USD indicator
    const usdElement = document.getElementById('usd-rate');
    const usdTrendElement = document.getElementById('usd-trend');
    if (usdElement) {
      usdElement.textContent = variations.usd.value.toLocaleString();
      if (usdTrendElement) {
        usdTrendElement.textContent = variations.usd.change;
        usdTrendElement.className = `indicator-trend ${variations.usd.direction}`;
      }
    }

    // Update SOL indicator
    const solElement = document.getElementById('sol-rate');
    const solTrendElement = document.getElementById('sol-trend');
    if (solElement) {
      solElement.textContent = `$${variations.sol.value.toFixed(2)}`;
      if (solTrendElement) {
        solTrendElement.textContent = variations.sol.change;
        solTrendElement.className = `indicator-trend ${variations.sol.direction}`;
      }
    }

    // Update BTC indicator
    const btcElement = document.getElementById('btc-rate');
    const btcTrendElement = document.getElementById('btc-trend');
    if (btcElement) {
      btcElement.textContent = `$${variations.btc.value.toLocaleString()}`;
      if (btcTrendElement) {
        btcTrendElement.textContent = variations.btc.change;
        btcTrendElement.className = `indicator-trend ${variations.btc.direction}`;
      }
    }

    // Update Compute Power
    const computeElement = document.getElementById('compute-power');
    if (computeElement) {
      computeElement.textContent = `${variations.computePower.value} TFLOPS`;
    }
  }

  generateVariation(base, range) {
    const variation = (Math.random() - 0.5) * range * 0.1;
    const newValue = base + variation;
    const changePercent = (variation / base * 100).toFixed(2);
    const direction = variation > 0 ? 'up' : 'down';
    const sign = variation > 0 ? '+' : '';

    return {
      value: newValue,
      change: `${sign}${changePercent}%`,
      direction
    };
  }

  initComputationVisualization() {
    const computationViz = document.getElementById('computation-viz');
    if (!computationViz) return;

    // Add flowing data particles
    this.createDataFlow();

    // Animate cause cards
    this.animateCauseCards();
  }

  createDataFlow() {
    const computeFlow = document.querySelector('.compute-flow');
    if (!computeFlow) return;

    // Create flowing particles between nodes
    setInterval(() => {
      const particle = document.createElement('div');
      particle.className = 'data-particle';
      particle.style.cssText = `
        position: absolute;
        width: 4px;
        height: 4px;
        background: var(--brand);
        border-radius: 50%;
        animation: flowData 3s linear forwards;
        pointer-events: none;
      `;

      computeFlow.appendChild(particle);

      // Remove particle after animation
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 3000);
    }, 1500);
  }

  animateCauseCards() {
    const causeCards = document.querySelectorAll('.cause-card');

    causeCards.forEach((card, index) => {
      // Stagger the animation start
      setTimeout(() => {
        card.style.animationDelay = `${index * 0.2}s`;
        card.classList.add('animated-cause');
      }, index * 200);
    });
  }
}

// Add CSS for data flow animation
const style = document.createElement('style');
style.textContent = `
  @keyframes flowData {
    0% {
      left: 20%;
      opacity: 0;
      transform: scale(0);
    }
    20% {
      opacity: 1;
      transform: scale(1);
    }
    80% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      left: 80%;
      opacity: 0;
      transform: scale(0);
    }
  }

  .animated-cause {
    animation: causePulse 4s ease-in-out infinite;
  }

  @keyframes causePulse {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }

  .geometric-logo svg {
    animation: logoGlow 6s ease-in-out infinite;
  }

  @keyframes logoGlow {
    0%, 100% {
      filter: drop-shadow(0 0 20px rgba(255,90,42,0.3));
    }
    50% {
      filter: drop-shadow(0 0 30px rgba(255,90,42,0.6));
    }
  }
`;
document.head.appendChild(style);

// Initialize the cultural gateway
const cryptoCulturalGateway = new CryptoCulturalGateway();