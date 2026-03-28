// extras.js - Veloxar JS Additions for new GSAP animations

document.addEventListener('DOMContentLoaded', () => {
  // We need to wait a slight bit for main GSAP to load and register if this executes parallelly
  setTimeout(() => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    // Reveal animations for new missions grid
    gsap.from('.mission-showcase', {
      opacity: 0,
      y: 60,
      stagger: 0.3,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.missions-grid',
        start: 'top 80%',
        toggleActions: 'play none none none'
      }
    });

    // Reveal analytics dash cards
    gsap.from('.dash-card', {
      opacity: 0,
      y: 40,
      scale: 0.95,
      stagger: 0.15,
      duration: 0.8,
      ease: 'back.out(1.2)',
      scrollTrigger: {
        trigger: '.dash-grid',
        start: 'top 85%',
        toggleActions: 'play none none none'
      }
    });

    // Animate Bar Chart Widths
    ScrollTrigger.create({
      trigger: '.bar-chart',
      start: 'top 85%',
      once: true,
      onEnter: () => {
        document.querySelectorAll('.bar-fill').forEach((bar, index) => {
          const width = bar.getAttribute('data-w');
          setTimeout(() => {
            bar.style.width = width + '%';
          }, index * 200); // Stagger animation
        });
      }
    });

    // Animate Dashboard Status ticker numbers
    ScrollTrigger.create({
      trigger: '.dash-stats',
      start: 'top 90%',
      once: true,
      onEnter: () => {
        document.querySelectorAll('.ds-val').forEach(val => {
          const textNode = Array.from(val.childNodes).find(n => n.nodeType === 3);
          if(textNode) {
            const num = parseFloat(textNode.nodeValue);
            if(!isNaN(num)) {
              let obj = { x: 0 };
              gsap.to(obj, {
                x: num,
                duration: 2.5,
                ease: 'power2.out',
                onUpdate: () => {
                  textNode.nodeValue = obj.x.toFixed(Number.isInteger(num) ? 0 : 1) + ' ';
                }
              });
            }
          }
        });
      }
    });

  }, 100);
});
