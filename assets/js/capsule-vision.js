/*
  capsule-vision.js — Vision page implementation using unified chat component
*/
(() => {
  // Initialize the unified chat component with Vision page configuration
  const chatInterface = window.VulcanoChatComponent.create('chat-interface', {
    hasVoiceOrb: false,           // Simple form without voice orb
    hasHorizontalChips: false,    // Simple chips instead of horizontal scrolling
    placeholder: "Pregúntame cómo podemos llevar esta visión a tu organización",
    voiceHint: "Toca para hablar",
    required: true,
    defaultChips: [
      { prompt: "¿Cómo puede Vulcano AI reducir el tiempo frente a pantallas en mi empresa?", label: "Impacto en equipos" },
      { prompt: "Quiero un plan para llevar esta cápsula a Alexa o dispositivos de voz", label: "Plan Alexa" }
    ],
    initialMessage: `
      <article class="capsule-message from-agent">
        <span class="capsule-sender">Vulcano</span>
        <p>Soñamos con una herramienta hecha en Hispanoamérica para Hispanoamérica. Una cápsula íntima que traduce el caos global de la IA en decisiones locales, diseñadas para personas que prefieren vivir el mundo fuera de la pantalla.</p>
        <p>Orquestamos agentes y datos con un protocolo propio, afinado como un reloj boutique. Todo se siente cálido, preciso y humano. Nada grita software: sólo recibes la señal justa, en el momento justo.</p>
        <p>Nuestro manifiesto es simple: menos tiempo navegando interfaces, más tiempo caminando por la ciudad, liderando equipos o creando futuro. La tecnología se repliega; tú avanzas con claridad.</p>
      </article>
      <article class="capsule-message from-agent">
        <span class="capsule-sender">Vulcano</span>
        <p>Esta cápsula es la puerta. El siguiente paso es extender la experiencia a audio nativo, a Alexa, a los espacios donde nuestros socios viven. Cada módulo será tan sencillo como pedir consejo a alguien de confianza.</p>
        <p>Si quieres que personalicemos la cápsula para tu equipo o territorio, escríbenos. Estamos formando alianzas discretas con organizaciones que comparten nuestra visión de abundancia y elegancia funcional.</p>
      </article>
    `,
    onSubmit: handleVisionInput
  });

  if (!chatInterface) {
    console.error('Failed to initialize Vision chat interface');
    return;
  }

  // Vision-specific response handler
  function handleVisionInput(query, { appendAgent, updateChips, state }) {
    const placeholder = appendAgent(['Procesando tu consulta...'], {});
    setTimeout(() => {
      const response = buildVisionResponse(query);
      updateAgent(placeholder, response.paragraphs, {});
      updateChips(response.suggestions);
    }, 300);
  }

  function updateAgent(node, paragraphs, meta) {
    if (!node) return;
    Array.from(node.querySelectorAll('p')).forEach(p => p.remove());
    paragraphs.forEach(text => {
      const p = document.createElement('p');
      p.textContent = text;
      node.appendChild(p);
    });
  }

  function buildVisionResponse(query) {
    const clean = query.trim().toLowerCase();

    // Vision-specific responses based on common queries
    if (clean.includes('alexa') || clean.includes('voz') || clean.includes('audio')) {
      return {
        paragraphs: [
          "Excelente pregunta. Nuestra hoja de ruta incluye expansión nativa a Alexa Skills y Google Assistant durante Q1 2025.",
          "La experiencia será la misma: conversación natural sobre IA en LATAM, pero sin pantallas. Imagina despertar y preguntar: '¿Qué movió el ecosistema argentino ayer?' y recibir el briefing perfecto mientras te preparas.",
          "Si quieres ser partner de lanzamiento o piloto beta, escríbenos a ivan@vulcano.ai. Priorizamos a organizaciones que comparten nuestra visión de tecnología invisible y efectiva."
        ],
        suggestions: [
          { prompt: "¿Cuándo estará disponible la integración con Alexa?", label: "Timeline Alexa" },
          { prompt: "Quiero ser partner de lanzamiento para la experiencia de voz", label: "Partnership" }
        ]
      };
    }

    if (clean.includes('empresa') || clean.includes('equipo') || clean.includes('organización') || clean.includes('pantalla')) {
      return {
        paragraphs: [
          "Vulcano AI está diseñado específicamente para líderes y equipos que valoran el tiempo fuera de las pantallas.",
          "Ofrecemos implementaciones personalizadas: desde briefings matutinos por WhatsApp hasta dashboards executivos que solo muestran lo crucial. Nuestros clientes reportan 40% menos tiempo en 'research mode' y mayor claridad estratégica.",
          "Podemos adaptar la cápsula a tu industria, geografía y nivel de detalle. ¿Te interesa una demostración personalizada?"
        ],
        suggestions: [
          { prompt: "Quiero una demostración personalizada para mi equipo", label: "Demo personalizada" },
          { prompt: "¿Qué industrias ya están usando Vulcano AI?", label: "Casos de uso" }
        ]
      };
    }

    if (clean.includes('precio') || clean.includes('costo') || clean.includes('inversión')) {
      return {
        paragraphs: [
          "Vulcano AI Premium está diseñado como una herramienta boutique para organizaciones selectas.",
          "Nuestro modelo es de membresía anual con implementación personalizada. Los precios varían según alcance geográfico, nivel de personalización y volumen de usuarios.",
          "Contáctanos directamente para una propuesta adaptada a tu contexto: ivan@vulcano.ai o WhatsApp +57 319 362 0926."
        ],
        suggestions: [
          { prompt: "Quiero recibir una propuesta personalizada", label: "Propuesta" },
          { prompt: "¿Ofrecen períodos de prueba?", label: "Trial" }
        ]
      };
    }

    if (clean.includes('diferencia') || clean.includes('competitors') || clean.includes('único')) {
      return {
        paragraphs: [
          "A diferencia de dashboards genéricos o alertas automatizadas, Vulcano AI está específicamente entrenado en el ecosistema LATAM.",
          "Entendemos matices regionales, conectamos puntos entre países y priorizamos señales que realmente importan para decisiones estratégicas en la región.",
          "No somos una herramienta más: somos una extensión de tu criterio, diseñada por y para líderes hispanoamericanos."
        ],
        suggestions: [
          { prompt: "¿Cómo entrenan sus modelos para LATAM específicamente?", label: "Modelo LATAM" },
          { prompt: "Quiero conocer casos de éxito regionales", label: "Casos éxito" }
        ]
      };
    }

    // Default response for general queries
    return {
      paragraphs: [
        `Gracias por tu interés en "${shorten(clean)}".`,
        "Vulcano AI Premium está diseñado para organizaciones que quieren mantenerse informadas sobre IA en LATAM sin sacrificar tiempo de pantalla.",
        "Ofrecemos experiencias personalizadas, desde briefings por audio hasta integraciones con tus herramientas existentes. ¿Te gustaría explorar cómo implementarlo en tu contexto específico?"
      ],
      suggestions: [
        { prompt: "Cuéntame más sobre implementaciones personalizadas", label: "Personalización" },
        { prompt: "¿Cómo puedo contactar al equipo directamente?", label: "Contacto" }
      ]
    };
  }

  function shorten(str, max = 60) {
    if (str.length <= max) return str;
    return `${str.slice(0, max - 1)}…`;
  }
})();