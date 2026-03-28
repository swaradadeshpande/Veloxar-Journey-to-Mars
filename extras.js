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

    // Chart.js init (Donut)
    const ctxAtm = document.getElementById('atm-chart');
    if (ctxAtm && typeof Chart !== 'undefined') {
      Chart.defaults.color = '#c8d4e8';
      Chart.defaults.font.family = "'Inter', sans-serif";
      
      new Chart(ctxAtm, {
        type: 'doughnut',
        data: {
          labels: ['Carbon Dioxide', 'Nitrogen', 'Argon', 'Oxygen/Other'],
          datasets: [{
            data: [95.3, 2.6, 1.9, 0.16],
            backgroundColor: ['#c1440e', '#00f5ff', '#7b2fff', '#fca311'],
            borderWidth: 0,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { color: '#c8d4e8', font: { family: 'Inter', size: 12 } } },
            tooltip: { callbacks: { label: function(c) { return ' ' + c.label + ': ' + c.raw + '%'; } } }
          },
          cutout: '75%'
        }
      });
    }

    // Chart.js init (Bar)
    const ctxTransit = document.getElementById('transit-chart');
    if (ctxTransit && typeof Chart !== 'undefined') {
      new Chart(ctxTransit, {
        type: 'bar',
        data: {
          labels: ['Viking 1 (1975)', 'MOM (2013)', 'Perseverance (2020)', 'Veloxar (2027)'],
          datasets: [{
            label: 'Transit Days',
            data: [304, 298, 203, 259],
            backgroundColor: ['#6b7a96', '#fca311', '#7b2fff', '#00f5ff'],
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y', // Horizontal bar chart
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: function(c) { return c.raw + ' Days'; } } }
          },
          scales: {
            x: { display: false, grid: { display: false } },
            y: { ticks: { color: '#c8d4e8', font: { family: "'Share Tech Mono', monospace" } }, grid: { display: false }, border: { display: false } }
          }
        }
      });
    }

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

  // Sound Toggle Logic
  const soundBtn = document.getElementById('sound-btn');
  const bgAudio = document.getElementById('bg-audio');
  let isPlaying = false;
  
  if (soundBtn && bgAudio) {
    bgAudio.volume = 0.5;
    soundBtn.addEventListener('click', () => {
      if (isPlaying) {
        bgAudio.pause();
        soundBtn.innerHTML = '<i class="bi bi-volume-mute"></i>';
      } else {
        bgAudio.play();
        soundBtn.innerHTML = '<i class="bi bi-volume-up"></i>';
      }
      isPlaying = !isPlaying;
    });
  }

  // Vanilla Tilt Initialization
  if (typeof VanillaTilt !== 'undefined') {
    VanillaTilt.init(document.querySelectorAll(".stat-card, .fact-card, .rover-card, .dash-card"), {
      max: 8,
      speed: 400,
      glare: true,
      "max-glare": 0.15,
      scale: 1.02
    });
  }
});
