// ==============================
// PORTFOLIO - MAIN JAVASCRIPT
// ==============================

document.addEventListener('DOMContentLoaded', () => {

  // ---- CURSOR GLOW EFFECT ----
  const cursorGlow = document.getElementById('cursorGlow');
  if (cursorGlow && window.matchMedia('(pointer: fine)').matches) {
    document.addEventListener('mousemove', (e) => {
      cursorGlow.style.left = e.clientX + 'px';
      cursorGlow.style.top = e.clientY + 'px';
    });
  }

  // ---- HEADER SCROLL EFFECT ----
  const header = document.getElementById('header');
  const scrollTop = document.getElementById('scrollTop');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    // Header background on scroll
    if (scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Scroll to top button
    if (scrollY > 400) {
      scrollTop.classList.add('visible');
    } else {
      scrollTop.classList.remove('visible');
    }
  });

  // Scroll to top
  scrollTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ---- MOBILE MENU ----
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
    document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
  });

  // Close mobile menu when a link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  // ---- ACTIVE NAV LINK ON SCROLL ----
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-links a');

  function updateActiveNav() {
    const scrollY = window.scrollY + 200;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        navItems.forEach(item => {
          item.classList.remove('active');
          if (item.getAttribute('href') === '#' + sectionId) {
            item.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav);

  // ---- SCROLL REVEAL ANIMATIONS ----
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // ---- SKILL BARS ANIMATION ----
  const skillBars = document.querySelectorAll('.skill-bar-fill');

  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const width = entry.target.getAttribute('data-width');
        entry.target.style.width = width + '%';
      }
    });
  }, {
    threshold: 0.3
  });

  skillBars.forEach(bar => skillObserver.observe(bar));

  // ---- STAT COUNTER ANIMATION ----
  const statNumbers = document.querySelectorAll('.stat-number[data-count]');

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const count = parseInt(target.getAttribute('data-count'));
        animateCounter(target, count);
        counterObserver.unobserve(target);
      }
    });
  }, {
    threshold: 0.5
  });

  function animateCounter(element, target) {
    let startTimestamp = null;
    const duration = 2000;
    const suffix = element.hasAttribute('data-suffix') ? element.getAttribute('data-suffix') : '+';

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(easeOut * target);
      
      element.textContent = current + suffix;
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        element.textContent = target + suffix;
      }
    };
    
    window.requestAnimationFrame(step);
  }

  statNumbers.forEach(num => counterObserver.observe(num));

  // ---- TYPING EFFECT FOR HERO SUBTITLE ----
  const heroSubtitle = document.querySelector('.hero-subtitle');
  if (heroSubtitle) {
    const originalText = heroSubtitle.textContent;
    heroSubtitle.textContent = '';
    heroSubtitle.style.borderRight = '2px solid var(--accent-primary)';

    let charIndex = 0;
    function typeText() {
      if (charIndex < originalText.length) {
        heroSubtitle.textContent += originalText[charIndex];
        charIndex++;
        setTimeout(typeText, 60);
      } else {
        // Blinking cursor effect
        let blinkCount = 0;
        const blink = setInterval(() => {
          heroSubtitle.style.borderRight = heroSubtitle.style.borderRight === 'none' 
            ? '2px solid var(--accent-primary)' 
            : 'none';
          blinkCount++;
          if (blinkCount > 8) {
            clearInterval(blink);
            heroSubtitle.style.borderRight = 'none';
          }
        }, 500);
      }
    }

    // Start typing after a small delay
    setTimeout(typeText, 800);
  }

  // ---- PROJECT DOTS INTERACTION ----
  const projectDots = document.querySelectorAll('.project-dot');
  projectDots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      projectDots.forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
    });
  });

  // ---- SMOOTH SCROLL FOR ANCHOR LINKS ----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      e.preventDefault();
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ==============================
  // 3D INTERFACE
  // ==============================
  const canTilt = window.matchMedia('(pointer: fine)').matches &&
                  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- HERO 3D: portrait rotates, layers drift at their own depth ----
  const heroScene = document.getElementById('heroScene');
  const heroLayers = Array.from(document.querySelectorAll('#heroStage [data-depth]'));
  if (heroScene && canTilt) {
    let targetX = 0, targetY = 0, currentX = 0, currentY = 0, animating = false;

    const wake = () => {
      if (!animating) {
        animating = true;
        requestAnimationFrame(tickHero);
      }
    };

    document.addEventListener('mousemove', (e) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
      wake();
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      targetX = 0;
      targetY = 0;
      wake();
    });

    function tickHero() {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      heroScene.style.transform =
        `rotateY(${(currentX * 10).toFixed(2)}deg) rotateX(${(-currentY * 7).toFixed(2)}deg)`;
      heroLayers.forEach(layer => {
        const depth = parseFloat(layer.dataset.depth) || 0;
        layer.style.transform =
          `translate3d(${(currentX * depth).toFixed(2)}px, ${(currentY * depth * 0.6).toFixed(2)}px, 0)`;
      });
      if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
        requestAnimationFrame(tickHero);
      } else {
        animating = false;
      }
    }
  }

  // ---- 3D TILT CARDS ----
  const tiltSelector = [
    '.project-card', '.exp-item', '.process-step', '.edu-item',
    '.contact-list li', '.laptop', '.hero-stat'
  ].join(', ');

  if (canTilt) {
    document.querySelectorAll(tiltSelector).forEach(card => {
      card.classList.add('tilt');

      const glare = document.createElement('div');
      glare.className = 'tilt-glare';
      card.appendChild(glare);

      const isLarge = card.classList.contains('project-card') || card.classList.contains('exp-item') || card.classList.contains('laptop');
      const maxTilt = isLarge ? 6 : 9;
      const lift = isLarge ? 8 : 4;
      let rect = null;
      let raf = null;
      let resetTimer = null;

      const onEnter = () => {
        clearTimeout(resetTimer);
        rect = card.getBoundingClientRect();
        card.classList.add('is-tilting');
        card.style.transition = 'transform 0.12s ease-out';
      };

      const onMove = (e) => {
        if (!rect) rect = card.getBoundingClientRect();
        const px = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
        const py = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1);
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = null;
          const rx = ((0.5 - py) * maxTilt * 2).toFixed(2);
          const ry = ((px - 0.5) * maxTilt * 2).toFixed(2);
          card.style.transform =
            `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-${lift}px) scale3d(1.015, 1.015, 1.015)`;
          card.style.setProperty('--glare-x', `${(px * 100).toFixed(1)}%`);
          card.style.setProperty('--glare-y', `${(py * 100).toFixed(1)}%`);
        });
      };

      const onLeave = () => {
        rect = null;
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        card.classList.remove('is-tilting');
        card.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
        card.style.transform = '';
        resetTimer = setTimeout(() => {
          if (!card.classList.contains('is-tilting')) card.style.transition = '';
        }, 650);
      };

      card.addEventListener('mouseenter', onEnter);
      card.addEventListener('mousemove', onMove, { passive: true });
      card.addEventListener('mouseleave', onLeave);
    });
  }

});
