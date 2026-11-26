/**
 * Dr. Gnanvatsaldas Swami - Bangkok Event Website
 * - Lenis Smooth Scroll (paced and cinematic)
 * - Skiper30 3-Column Parallax Gallery (Scaled for Mobile with Squircle Cards)
 * - Handwriting Signature Animation via SVG glyphs
 * - IN-PLACE 3D Card Flip (Zero empty space below; flips right in place on scroll gesture)
 * - Rock-Solid Live NumberFlow Countdown Timer (Days, Hours, Minutes, Seconds)
 * - Prominent "Scroll Down to Fill In Registration Details" Bottom Banner
 * - 10s Idle Reminder with authentic macOS Dock Bounce Animation (Pure Glassmorphism)
 * - Built-in Gemini AI Event Assistant (Monochrome Glassmorphic UI with Pure SVGs)
 * - Full Mobile-First Responsive Optimization
 */

document.addEventListener('DOMContentLoaded', () => {

  const APPS_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzW9p8KaS4nWM_NjyV1ZCwsbBqEsVJQuc3WCtMol9C77pFZXWMFYS7dRWfhGnQwaPiF/exec";
  // =========================================================================
  // 1. Lenis Smooth Scrolling Initialization
  // =========================================================================
  let lenisInstance = null;

  if (typeof Lenis !== 'undefined') {
    lenisInstance = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -9 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.15,
    });

    function raf(time) {
      if (lenisInstance) {
        lenisInstance.raf(time);
      }
      updateParallax();
      if (typeof checkScrollClip === 'function') {
        checkScrollClip();
      }
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  } else {
    window.addEventListener('scroll', () => {
      requestAnimationFrame(() => {
        updateParallax();
        if (typeof checkScrollClip === 'function') {
          checkScrollClip();
        }
      });
    }, { passive: true });
  }

  // Smooth scroll helper
  function scrollToTarget(target, duration = 2.0, onComplete = null) {
    if (lenisInstance) {
      lenisInstance.scrollTo(target, {
        duration: duration,
        easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
        onComplete: onComplete,
      });
    } else {
      if (typeof target === 'number') {
        window.scrollTo({ top: target, behavior: 'smooth' });
      } else {
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
      if (onComplete) {
        setTimeout(onComplete, duration * 1000);
      }
    }
  }


  // =========================================================================
  // 2. Parallax Image Grid Animation (Skiper30 - 3 Columns)
  // =========================================================================
  const gallery = document.getElementById('gallery');
  const col0 = document.getElementById('gallery-col-0');
  const col1 = document.getElementById('gallery-col-1');
  const col2 = document.getElementById('gallery-col-2');

  function updateParallax() {
    if (!gallery || !col0 || !col1 || !col2) return;

    const rect = gallery.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    if (rect.bottom < -150 || rect.top > windowHeight + 150) return;

    const progress = (windowHeight - rect.top) / (windowHeight + rect.height);
    const clampedProgress = Math.max(0, Math.min(1, progress));

    // High-speed dynamic parallax animation (fast, fluid gliding motion)
    const offset0 = (clampedProgress - 0.5) * 360;
    const offset1 = (clampedProgress - 0.5) * -420;
    const offset2 = (clampedProgress - 0.5) * 380;

    col0.style.transform = `translate3d(0, ${offset0}px, 0)`;
    col1.style.transform = `translate3d(0, ${offset1}px, 0)`;
    col2.style.transform = `translate3d(0, ${offset2}px, 0)`;
  }


  // =========================================================================
  // 3. IN-PLACE 3D Card Flip (Zero empty space below!)
  // Card 0: Countdown + Venue Map
  // Card 1: Registration Form
  // Flips in-place on scroll gesture, swipe, or button clicks
  // =========================================================================
  const flipCard0 = document.getElementById('flipCard0');
  if (flipCard0) {
    flipCard0.style.transform = 'none';
  }
  const flipCard1 = document.getElementById('flipCard1');
  const stackSection = document.getElementById('stack-section');
  const idleDockContainer = document.getElementById('idleDockContainer');

  let currentCard = 0; // 0 = Card 0 (Countdown), 1 = Card 1 (Registration Form)
  let isFlipping = false;
  let isClipped = false;
  let lastUnclipTime = 0;
  let idleTimer = null;

  function getStackTop() {
    if (!stackSection) return 0;
    return Math.round(stackSection.getBoundingClientRect().top + window.scrollY);
  }

  function resetIdleTimer() {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  }

  function startIdleTimer() {
    resetIdleTimer();
    if (currentCard === 0 && isClipped) {
      // Exactly 10 seconds of resting on the countdown page triggers the jumping idle pop-up
      idleTimer = setTimeout(() => {
        if (currentCard === 0 && isClipped && idleDockContainer) {
          idleDockContainer.classList.add('is-visible');
          idleDockContainer.setAttribute('aria-hidden', 'false');
        }
      }, 10000);
    }
  }

  function clipAtCountdown(targetY) {
    if (isClipped) return;
    isClipped = true;
    currentCard = 0;
    const sTop = typeof targetY === 'number' ? targetY : getStackTop();
    if (lenisInstance) {
      lenisInstance.scrollTo(sTop, { immediate: true });
      lenisInstance.stop();
    } else {
      window.scrollTo({ top: sTop });
    }
    startIdleTimer();
  }

  function unclipAndScrollUp() {
    if (isFlipping) return;
    isClipped = false;
    lastUnclipTime = Date.now();
    resetIdleTimer();

    const stackTop = getStackTop();
    const targetY = Math.max(0, stackTop - window.innerHeight * 0.55);

    if (lenisInstance) {
      lenisInstance.start();
      lenisInstance.scrollTo(targetY, {
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -9 * t))
      });
    } else {
      window.scrollTo({
        top: targetY,
        behavior: 'smooth'
      });
    }
  }

  // Automatic scroll clip detector as user scrolls down
  window.checkScrollClip = function() {
    if (isClipped || currentCard === 1) return;
    if (Date.now() - lastUnclipTime < 900) return;

    const stackTop = getStackTop();
    if (window.scrollY >= stackTop - 12) {
      clipAtCountdown(stackTop);
    }
  };

  function highlightRegistrationForm() {
    const formCard = document.getElementById('flipCard1');
    if (formCard) {
      formCard.classList.remove('form-highlight');
      void formCard.offsetWidth; // force reflow
      formCard.classList.add('form-highlight');
    }
    // Do NOT auto-focus on nameInput to prevent keyboard from violently jumping up on mobile
  }

  function flipToCard(targetIndex) {
    if (currentCard === targetIndex || isFlipping || !flipCard0 || !flipCard1) return;
    isFlipping = true;
    currentCard = targetIndex;
    resetIdleTimer();

    if (idleDockContainer) {
      idleDockContainer.classList.remove('is-visible');
      idleDockContainer.setAttribute('aria-hidden', 'true');
    }

    const frame = document.getElementById('flipStackFrame');
    const stage = document.getElementById('flipStackStage');
    const section = stackSection || document.getElementById('stack-section');

    if (targetIndex === 1) {
      // 1. Flip Card 0 UP in 3D
      flipCard0.style.transition = 'transform 1.1s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease';
      flipCard0.style.transform = 'perspective(900px) translateY(-120%) rotateX(24deg)';
      flipCard0.style.pointerEvents = 'none';

      // 2. Card 1 begins revealing in-place
      flipCard1.style.transition = 'transform 1.1s cubic-bezier(0.16, 1, 0.3, 1)';
      flipCard1.style.transform = 'translateY(0px) scale(1)';
      flipCard1.style.pointerEvents = 'auto';

      // 3. Expand frame and section so the registration form flows naturally
      requestAnimationFrame(() => {
        if (frame) frame.classList.add('is-fullscreen');
        if (stage) stage.classList.add('is-fullscreen');
        if (section) section.classList.add('has-fullscreen');
      });

      // 4. Crucial: UNCLIP FOR DOWNWARD SCROLL
      // Free the window so user can scroll down naturally without a trapped inner scrollbar!
      isClipped = false;
      if (lenisInstance) {
        lenisInstance.start();
      }

      setTimeout(() => {
        highlightRegistrationForm();
        isFlipping = false;
      }, 1100);
    } else {
      // Reverse flow (Scrolling back UP to Card 0):
      // Dismiss mobile virtual keyboard immediately
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }

      // 1. Scroll window back to countdown stage top
      const stackTop = getStackTop();
      if (lenisInstance) {
        lenisInstance.scrollTo(stackTop, { immediate: true });
        lenisInstance.stop();
      } else {
        window.scrollTo({ top: stackTop });
      }
      isClipped = true;

      // 2. Shrink card back to bounded countdown frame
      if (frame) frame.classList.remove('is-fullscreen');
      if (stage) stage.classList.remove('is-fullscreen');
      if (section) section.classList.remove('has-fullscreen');

      // 3. Set Card 1 back to resting scale & position
      flipCard1.style.transition = 'transform 1.0s cubic-bezier(0.16, 1, 0.3, 1)';
      flipCard1.style.transform = 'translateY(16px) scale(0.96)';
      flipCard1.style.pointerEvents = 'none';

      // 4. Flip Card 0 back down into view
      flipCard0.style.transition = 'transform 1.0s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease';
      flipCard0.style.transform = 'perspective(900px) translateY(0%) rotateX(0deg)';
      flipCard0.style.pointerEvents = 'auto';

      setTimeout(() => {
        if (currentCard === 0) {
          flipCard0.style.transform = 'none';
        }
        isFlipping = false;
        startIdleTimer();
      }, 1050);
    }
  }

  // =========================================================================
  // Unified Window Scroll / Gesture Manager (Clipped and Unclipped State)
  // =========================================================================
  window.addEventListener('wheel', (e) => {
    // If currently on Card 1 (Registration form):
    if (currentCard === 1) {
      const stackTop = getStackTop();
      // If user reaches top of Card 1 and scrolls UP, flip Card 0 back down!
      if (window.scrollY <= stackTop + 10 && e.deltaY < -15) {
        e.preventDefault();
        if (!isFlipping) {
          flipToCard(0);
        }
        return;
      }
      // Otherwise allow native downward scrolling freely!
      return;
    }

    if (!isClipped) {
      const stackTop = getStackTop();
      if (e.deltaY > 0 && window.scrollY >= stackTop - 15) {
        e.preventDefault();
        clipAtCountdown(stackTop);
      }
      return;
    }

    // WE ARE CLIPPED on Card 0 (Countdown + Map):
    e.preventDefault();

    if (isFlipping) return;

    if (currentCard === 0) {
      if (e.deltaY > 12) {
        // Scrolling DOWN on countdown/map -> flip to registration card
        flipToCard(1);
      } else if (e.deltaY < -12) {
        // Scrolling UP on countdown/map -> unclip and scroll back up to gallery
        unclipAndScrollUp();
      }
    }
  }, { passive: false });

  // Touch gesture handling for mobile phones
  let touchStartY = 0;

  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    // If currently on Card 1 (Registration form):
    if (currentCard === 1) {
      const currentY = e.touches[0].clientY;
      const diffY = touchStartY - currentY; // negative = swipe down (scroll up)
      const stackTop = getStackTop();

      // If at top of registration card and user pulls down (diffY < -30): flip Card 0 back down!
      if (window.scrollY <= stackTop + 10 && diffY < -30) {
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
          document.activeElement.blur();
        }
        e.preventDefault();
        if (!isFlipping) {
          touchStartY = currentY;
          flipToCard(0);
        }
        return;
      }
      // Otherwise allow 100% natural downward thumb scrolling without any inner scrollbars!
      return;
    }

    if (!isClipped) {
      const stackTop = getStackTop();
      if (window.scrollY >= stackTop - 15) {
        const currentY = e.touches[0].clientY;
        const diffY = touchStartY - currentY;
        if (diffY > 0) {
          clipAtCountdown(stackTop);
          e.preventDefault();
        }
      }
      return;
    }

    // WE ARE CLIPPED on Card 0 (Countdown + Map):
    const currentY = e.touches[0].clientY;
    const diffY = touchStartY - currentY; // positive = swipe up (scroll down); negative = swipe down (scroll up)

    e.preventDefault();

    if (isFlipping) return;
    if (Math.abs(diffY) < 18) return;

    if (currentCard === 0) {
      if (diffY > 18) {
        // Swiping up over countdown or map -> flip to register
        touchStartY = currentY;
        flipToCard(1);
      } else if (diffY < -18) {
        // Swiping down over countdown or map -> unclip to gallery
        touchStartY = currentY;
        unclipAndScrollUp();
      }
    }
  }, { passive: false });

  // Keyboard navigation support while clipped
  window.addEventListener('keydown', (e) => {
    if (!isClipped) return;
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
    if (isInput) return;

    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
      e.preventDefault();
      if (currentCard === 0 && !isFlipping) {
        flipToCard(1);
      }
    } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
      e.preventDefault();
      if (currentCard === 1 && !isFlipping) {
        flipToCard(0);
      } else if (currentCard === 0 && !isFlipping) {
        unclipAndScrollUp();
      }
    }
  });

  // Bottom action banner on Card 0: flips to Card 1
  const cardScrollPrompt = document.getElementById('cardScrollPrompt');
  if (cardScrollPrompt) {
    cardScrollPrompt.addEventListener('click', () => {
      flipToCard(1);
    });
  }

  // "Back to Event Info" button on Card 1: flips back to Card 0
  const backToInfoBtn = document.getElementById('backToInfoBtn');
  if (backToInfoBtn) {
    backToInfoBtn.addEventListener('click', () => {
      flipToCard(0);
    });
  }

  // Flyer "REGISTER NOW" button: scrolls smoothly to stack section and flips to Card 1
  const flyerRegisterBtn = document.getElementById('flyer-register-btn');
  if (flyerRegisterBtn) {
    flyerRegisterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const stackTop = getStackTop();
      if (lenisInstance) lenisInstance.start();
      scrollToTarget(stackTop, 1.4, () => {
        clipAtCountdown(stackTop);
        flipToCard(1);
      });
    });
  }

  // Back to Top button in footer: unclips and scrolls to top
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    backToTop.addEventListener('click', (e) => {
      e.preventDefault();
      isClipped = false;
      lastUnclipTime = Date.now();
      if (lenisInstance) lenisInstance.start();
      scrollToTarget(0, 1.8);
    });
  }

  // Back to Flyer button on pass receipt
  const backToFlyerBtn = document.getElementById('backToFlyerBtn');
  if (backToFlyerBtn) {
    backToFlyerBtn.addEventListener('click', () => {
      isClipped = false;
      lastUnclipTime = Date.now();
      if (lenisInstance) lenisInstance.start();
      scrollToTarget(0, 1.8);
    });
  }


  // =========================================================================
  // 4. Signature Handwriting Animation (Dr. Gnanvatsaldas Swami)
  // =========================================================================
  const signatureSvg = document.getElementById('signature-svg');
  const signaturePaths = [{"char": "D", "d": "M44.47 112.26Q44.73 112.34 46.84 113.68Q62.30 123.94 78.51 125.50Q78.75 125.52 80.01 125.52Q86.74 125.52 89.14 125.18Q103.67 123.10 113.74 115.42Q118.56 111.79 123.02 106.33Q131.09 96.78 136.89 83.31Q143.90 66.93 147.30 46.90Q149.49 33.03 149.49 21.37Q149.49 10.72 147.65 1.94Q144.96-10.82 138.89-12.75Q137.92-13.04 136.39-13.04Q129.40-12.96 117.72-2.89Q106.22 7.27 93.54 25.30Q84.07 38.80 75.11 54.33Q66.88 68.57 51.01 99.66Q44.84 111.76 44.47 112.26M31.58 143.77L31.60 144.30Q31.60 144.96 31.37 145.61Q30.63 147.51 28.52 147.51Q27.23 147.51 26.46 146.75Q25.30 145.93 25.26 145.13Q25.22 144.32 25.22 144.16Q25.22 143 25.78 140.74Q26.65 137.23 30.94 122.81Q32.34 118.06 34.50 111.31L34.45 111.26Q34.29 111.10 33.69 110.55Q33.08 109.99 32.34 109.39Q23.48 101.55 17.50 95.02Q10.96 87.98 9.90 83.12Q9.64 81.94 9.64 81.62Q9.64 81.20 9.85 80.72Q10.40 79.56 11.17 79.38Q11.93 79.20 12.28 79.20Q13.12 79.20 13.94 79.67Q14.65 80.07 15.07 80.78Q15.49 81.49 15.84 82.65Q16.44 84.71 18 86.89Q22.64 93.41 36.40 105.64L36.43 105.67Q36.77 104.01 42.86 86.66Q44.55 81.96 47.85 72.39Q56.36 48 67.57 18.60Q70.86 9.98 72 7.19Q77.83-6.92 80.25-13.59Q81.67-17.55 82.02-20.55Q81.52-20.16 80.80-19.60Q79.64-18.68 78.56-17.68Q71.10-10.85 70.97-8.66Q70.89-7.10 69.65-6.39Q69.02-6.08 68.36-6.08Q66.70-6.08 65.62-7.50Q64.93-8.42 64.93-9.61Q64.93-11.30 66.36-13.56Q68.49-16.89 74.32-22.21Q79.99-27.33 83.20-27.57Q85.10-27.54 86.39-26.33Q88.19-24.61 88.19-21.40Q88.19-17.73 86.10-11.48Q83.57-4.52 78.85 6.98Q72.53 22.35 57 65.09L49.03 87.87Q47.77 91.46 46.71 94.30Q48.14 91.54 49.93 88.11Q53.44 81.41 55.33 77.69Q70.42 48.64 82.78 29.99Q94.78 11.83 105.67 0.17Q115.03-9.82 124.50-15.38Q130.56-18.81 135.78-18.81Q145.75-18.81 150.78-7.53Q153.39-1.65 154.53 6.63Q155.58 13.78 155.58 21.87Q155.58 29.84 154.55 38.72Q152.97 54.94 147.75 71.63Q146.12 77.03 144.72 80.69Q143.32 84.34 141.11 89Q138.44 94.67 136.15 98.56Q133.86 102.45 130.74 106.67Q123.65 116.35 115 122.06Q106.35 127.76 95.28 130.03Q89.01 131.32 82.91 131.32Q78.01 131.32 73.21 130.48Q67.01 129.29 60.37 126.89Q51.83 123.62 42.86 117.64Q42.39 117.32 42.12 117.11Q42.02 117.80 40.83 120.35Q39.04 124.20 37.93 126.84Q36.27 130.88 34.64 135.46Q33.29 139.29 33.24 139.71Q33.24 140.26 33.30 140.59Q33.37 140.92 33.37 141.32Q33.37 142.11 33 142.71Q32.50 143.53 31.58 143.77"}, {"char": "r", "d": "M191.52 113.50Q190.26 113.50 189.25 113.29Q185.61 112.37 183.61 109.60Q182 107.43 182 104.01Q182 101.84 182.63 99.21Q184.53 90.45 194.53 73.50Q196.32 70.52 198.06 66.41Q199.17 63.88 199.56 62.33Q199.96 60.79 199.96 59.13Q199.96 56.68 199.06 55.46Q198.17 54.25 196.06 53.67Q195.19 53.43 192.13 53.43Q187.99 53.43 183.49 55.70Q179 57.97 175.52 61.45Q172.04 64.93 170.95 68.17Q170.61 69.28 170.61 70.20Q170.61 70.78 170.74 71.34Q171.11 72.84 171.11 73.55Q171.11 74.37 170.40 75.08Q169.56 76.08 168.19 76.08Q166.37 76.08 165.42 74.34Q164.65 72.87 164.65 70.23Q164.65 65.14 168.95 59.95Q173.70 54.15 180.82 50.59Q186.75 47.63 192.97 47.63Q196.06 47.63 198.69 48.50Q205.97 50.93 205.97 59.24Q205.97 61.74 205.23 64.19Q203.57 69.89 198.51 78.46Q192.07 89.43 189.41 97.07Q188.01 101.50 188.01 104.09Q188.01 104.96 188.19 105.52Q188.36 106.09 188.86 106.66Q189.36 107.22 189.89 107.46Q190.62 107.75 191.92 107.75Q192.89 107.75 193.84 107.51Q199.83 105.98 207.16 100.39Q209.93 98.21 214.20 94.42Q218.47 90.64 222.29 87Q237.35 72.81 239.11 72.31Q239.59 72.23 239.98 72.23Q241.41 72.23 242.30 73.29Q242.96 74.08 242.96 75.03Q242.96 76.61 241.38 77.61Q240.54 78.19 237.29 81.15Q230.62 87.16 226.06 91.46Q217.49 99.58 211.88 104.03Q199.98 113.50 191.52 113.50"}, {"char": ".", "d": "M250.64 81.28Q251.61 81.36 252.24 81.94Q252.98 82.54 252.98 83.39Q252.98 84.39 252.18 85.01Q251.37 85.63 251.32 85.87Q251.14 86.87 250.37 87.76Q249.13 89.21 247.45 89.21Q246.18 89.21 245.22 88.46Q244.26 87.71 244.26 86.42Q244.26 85.26 245.23 82.73Q245.73 81.49 246.05 81.01Q246.76 79.96 248.26 79.96Q250 79.96 250.64 81.28"}, {"char": " ", "d": ""}, {"char": "G", "d": "M369.50 171.80Q367.52 171.80 366.63 171.53Q363.04 170.29 361.62 165.84Q360.90 163.57 360.90 160.27Q360.90 152.71 364.59 139.31Q366.97 130.85 371.04 120.14Q375.12 109.44 379.73 99.58Q380.05 98.92 380.26 98.55L379.39 98.50Q376.04 98.50 373.28 99.47Q370.53 100.45 367.39 102.74Q365.52 104.14 364.49 104.14Q363.80 104.14 363.09 103.80Q361.30 102.98 361.30 101.08Q361.30 100.61 361.46 100.13Q361.85 99.21 364.94 97.07Q369.34 94.15 373.98 93.20Q374.98 92.99 375.99 92.92Q376.99 92.85 381.58 92.85Q382.84 92.88 382.97 92.91L386.11 86.87Q389.17 80.86 391.33 76.98Q394.31 71.71 399.37 63.32Q401.75 59.39 403.04 57.34Q406.10 52.62 412.74 42.70Q413.69 41.28 414.51 40.04L395 59.50L381.39 72.60Q367.18 86.31 355.63 96.04Q333.03 115.24 321.83 115.50L320.38 115.53Q318.85 115.53 317.71 115.32Q311.91 114.05 309.18 109.07Q306.46 104.09 306.46 96.44Q306.46 88.50 310.01 75.93Q313.31 64.38 318.45 53.09Q327.84 33.16 345.19 16.13Q366.52-4.73 391.67-13.27Q409.08-19.37 422.50-20.45Q424.66-20.60 427.98-20.60Q431.30-20.60 433.07-20.45Q448.60-18.57 450.18-8.40Q450.34-7.37 450.34-6.26Q450.34-3.07 448.42 2.44Q447.44 5.29 446.93 6.28Q446.41 7.27 444.78 7.27Q442.85 7.27 441.88 5.45Q441.59 4.84 441.59 4.08Q441.59 3.10 442.54 0.62Q444.30-4.02 444.30-6.89Q444.30-11.03 440.24-12.91Q435.60-14.96 428.40-14.96Q414.53-14.96 393.60-7.71Q370.63 0.20 350.59 19.42Q336.30 33.16 327.23 49.35Q321.25 60.47 317.04 73.87Q312.84 87.26 312.47 96.47Q312.47 98.34 312.70 100.47Q313.52 107.41 316.11 108.81Q318.03 109.83 320.03 109.83Q321.46 109.83 323.22 109.46Q331.53 107.62 346.43 95.70Q364.81 80.83 396.10 49.82Q405.04 40.96 412.32 34.32Q419.60 27.67 421.92 26.30Q423.34 25.49 424.58 25.49Q425.53 25.49 426.35 25.96Q428.14 27.01 428.14 29.04Q428.14 29.55 427.98 30.05Q427.27 32.24 420.52 42.23Q409.10 58.92 401.38 71.97Q396.66 79.93 394.07 84.94L389.35 94.22L389.56 94.25Q393.97 95.49 396.75 97.36Q399.53 99.23 401.51 102.27Q403.80 105.77 404.70 110.60Q405.20 113.18 405.20 115.92Q405.20 120.09 404.07 124.71Q401.54 135.36 394.31 147.33Q390.43 153.84 387.24 158.06Q384.05 162.28 380.44 165.68Q375.48 170.32 371.50 171.48Q370.29 171.80 369.50 171.80M368.10 166.13L368.23 166.13Q368.95 166.13 369.97 165.76Q374.59 163.83 381.39 155.53Q384.69 151.39 388.31 145.36Q391.94 139.34 394.36 133.99Q395.92 130.45 397.18 126.47Q399.11 120.35 399.19 116.85Q399.19 113.26 398.63 110.31Q398.48 109.52 398.24 108.81Q396.71 103.98 393.31 101.74Q392.18 101 389.64 100.13L386.59 99.42Q386.59 99.55 386.48 99.74Q382.47 107.99 378.04 119.12Q374.69 127.61 372.51 134.36Q367.10 151.34 366.92 159.98Q366.92 161.28 367.07 162.62Q367.23 164.39 367.57 165.21Q368 166.10 368.10 166.13"}, {"char": "n", "d": "M435 82.23Q436.81 80.96 441.64 76.88L443.51 75.29Q447.52 71.84 450.42 71.84Q453.69 71.84 458.04 76.03Q461.97 79.80 464.97 80.75Q467.03 81.38 469.33 81.38Q473.76 81.38 480.19 79.56Q483.67 78.59 490.02 76.03Q495.22 73.95 496.30 73.55Q498.75 72.55 499.28 72.29Q500.47 71.79 501.26 71.79Q501.84 71.79 502.50 72.02Q504.08 72.79 504.08 74.58Q504.08 75.56 503.31 76.37Q502.34 77.40 497.51 79.22Q493.64 80.70 491.18 81.67Q481.88 85.47 475.31 86.53Q472.07 87.05 469.33 87.05Q466.93 87.05 464.87 86.66Q459.52 85.52 453.80 80.04Q451.26 77.61 450.47 77.61Q450.21 77.61 449.79 77.82Q448.94 78.25 444.01 82.44Q437.21 88.16 434.47 88.45Q433.84 88.53 433.47 88.53Q432.91 88.53 432.44 88.40Q429.06 87.26 429.06 82.81Q429.06 81.20 429.27 80.43Q429.77 78.72 431.09 75.95Q432.02 74 432.94 72.47Q434.28 70.15 436.18 68.91Q437.87 67.80 439.35 67.80Q440.82 67.80 441.98 68.89Q442.85 69.89 442.85 70.92Q442.85 71.44 442.62 71.97Q441.88 73.63 439.79 73.63L439.45 73.61Q438.82 73.61 436.68 77.90Q435.23 80.78 435 82.23"}, {"char": "a", "d": "M503.34 77.30L502.05 78.96Q505.69 77.24 512.94 72.71Q514.97 71.44 515.20 71.26Q514.76 70.76 513.07 70.76Q510.77 70.76 507.66 73.13Q505.37 74.90 503.34 77.30M520.24 68.07Q521.16 67.30 524.72 64.80Q527.33 62.93 527.89 62.65Q528.44 62.37 529.10 62.37Q530.97 62.37 532.03 64.32Q532.47 65.17 532.47 65.91Q532.47 67.49 527.68 75.19Q522.38 83.78 522.38 87Q522.38 88.61 522.53 88.92Q522.90 89.58 524.17 89.95Q524.54 90.06 524.96 90.06Q528.36 90.06 534.90 87.03Q540.67 84.39 545.37 81.73Q546.87 80.88 552.01 78.11Q557.29 75.29 560.11 73.58Q563.56 71.52 564.67 71.52Q566.41 71.52 566.99 72.60Q567.57 73.68 567.57 74.48Q567.57 76.40 565.57 77.22Q564.91 77.51 562.14 79.14Q558.58 81.23 556.02 82.54L549.51 86.10Q544.05 89.19 538.83 91.61Q535.19 93.30 532.92 94.15Q528.47 95.81 524.83 95.81Q523.85 95.81 523.14 95.67Q518.95 94.83 517.02 91.35Q516.34 89.98 516.30 88.90Q516.26 87.82 516.26 87.53Q516.26 84.05 518.58 79.14Q519.55 77.11 521.22 74.34L520.40 74.90Q517.92 76.58 516.84 77.17Q508.09 82.70 503.95 84.50Q501.07 85.79 500.18 85.84Q499.28 85.89 499.17 85.89Q497.25 85.89 496.01 84.55Q494.74 83.28 494.74 81.49Q494.74 78.67 497.84 74.65Q500.94 70.63 505.26 67.67Q509.51 64.96 513.36 64.96Q516.92 64.96 519.21 66.96Q519.84 67.51 520.24 68.07"}, {"char": "n", "d": "M565.09 82.23Q566.91 80.96 571.74 76.88L573.61 75.29Q577.62 71.84 580.52 71.84Q583.79 71.84 588.14 76.03Q592.06 79.80 595.07 80.75Q597.13 81.38 599.42 81.38Q603.85 81.38 610.28 79.56Q613.76 78.59 620.12 76.03Q625.31 73.95 626.39 73.55Q628.85 72.55 629.37 72.29Q630.56 71.79 631.35 71.79Q631.93 71.79 632.59 72.02Q634.17 72.79 634.17 74.58Q634.17 75.56 633.41 76.37Q632.43 77.40 627.61 79.22Q623.73 80.70 621.28 81.67Q611.97 85.47 605.41 86.53Q602.16 87.05 599.42 87.05Q597.02 87.05 594.97 86.66Q589.61 85.52 583.89 80.04Q581.36 77.61 580.57 77.61Q580.30 77.61 579.88 77.82Q579.04 78.25 574.11 82.44Q567.31 88.16 564.56 88.45Q563.93 88.53 563.56 88.53Q563.01 88.53 562.53 88.40Q559.16 87.26 559.16 82.81Q559.16 81.20 559.37 80.43Q559.87 78.72 561.19 75.95Q562.11 74 563.03 72.47Q564.38 70.15 566.28 68.91Q567.97 67.80 569.44 67.80Q570.92 67.80 572.08 68.89Q572.95 69.89 572.95 70.92Q572.95 71.44 572.71 71.97Q571.97 73.63 569.89 73.63L569.55 73.61Q568.91 73.61 566.78 77.90Q565.33 80.78 565.09 82.23"}, {"char": "v", "d": "M629.56 109.97Q629.14 109.97 628.77 109.94Q624.76 109.60 624.76 103Q624.76 100.87 625.26 98.05Q625.76 95.12 627.16 89.19Q628.35 84.18 628.85 81.36Q629.45 77.88 629.45 74.82Q628.82 74.05 628.79 73.18Q628.79 72.52 629.16 71.73Q629.53 70.94 630.28 70.52Q631.04 70.10 631.85 70.10Q633.57 70.10 634.57 71.42Q635.10 72.16 635.25 73.01Q635.41 73.87 635.41 75.27Q635.41 78.25 634.86 81.58Q634.30 84.92 632.93 90.80Q631.64 96.18 631.19 98.84Q630.82 100.87 630.75 102.74Q635.07 98.44 642.74 88.48L646.70 83.41Q649.41 79.99 653.21 74.82Q657.98 68.38 658.85 67.67Q659.72 66.96 660.80 66.96Q662.62 66.96 663.44 68.73Q663.60 69.60 663.60 70.23Q663.60 71.07 663.31 71.44L664.02 73.95Q665.52 79.85 667.32 81.30Q669.11 82.75 671.03 82.75Q672.25 82.75 673.75 82.36Q680.95 80.38 690.92 73.42Q691.94 72.68 692.55 72.29Q693.16 71.89 693.60 71.72Q694.05 71.55 694.58 71.55Q697.51 71.81 697.51 74.45Q697.51 75.37 696.80 76.19Q695.87 77.11 692.97 79.08Q690.07 81.04 686.91 82.86Q677.34 88.37 671.43 88.42Q669.45 88.42 668.34 88.21Q667.05 87.90 665.60 87.16Q661.09 84.81 658.77 77.35Q655.03 82.41 645.48 94.59Q643.53 97.10 640.75 100.41Q637.97 103.72 636.23 105.59Q632.20 109.97 629.56 109.97"}, {"char": "a", "d": "M695.92 77.30L694.63 78.96Q698.27 77.24 705.52 72.71Q707.55 71.44 707.79 71.26Q707.34 70.76 705.65 70.76Q703.36 70.76 700.25 73.13Q697.96 74.90 695.92 77.30M712.83 68.07Q713.75 67.30 717.31 64.80Q719.92 62.93 720.47 62.65Q721.03 62.37 721.69 62.37Q723.56 62.37 724.61 64.32Q725.06 65.17 725.06 65.91Q725.06 67.49 720.26 75.19Q714.96 83.78 714.96 87Q714.96 88.61 715.12 88.92Q715.49 89.58 716.76 89.95Q717.12 90.06 717.55 90.06Q720.95 90.06 727.49 87.03Q733.26 84.39 737.95 81.73Q739.46 80.88 744.60 78.11Q749.87 75.29 752.69 73.58Q756.15 71.52 757.26 71.52Q759 71.52 759.58 72.60Q760.16 73.68 760.16 74.48Q760.16 76.40 758.15 77.22Q757.49 77.51 754.72 79.14Q751.16 81.23 748.61 82.54L742.09 86.10Q736.64 89.19 731.42 91.61Q727.78 93.30 725.51 94.15Q721.05 95.81 717.41 95.81Q716.44 95.81 715.73 95.67Q711.53 94.83 709.61 91.35Q708.92 89.98 708.88 88.90Q708.84 87.82 708.84 87.53Q708.84 84.05 711.17 79.14Q712.14 77.11 713.80 74.34L712.98 74.90Q710.51 76.58 709.42 77.17Q700.67 82.70 696.53 84.50Q693.66 85.79 692.76 85.84Q691.86 85.89 691.76 85.89Q689.83 85.89 688.59 84.55Q687.33 83.28 687.33 81.49Q687.33 78.67 690.43 74.65Q693.53 70.63 697.85 67.67Q702.09 64.96 705.94 64.96Q709.50 64.96 711.80 66.96Q712.43 67.51 712.83 68.07"}, {"char": "t", "d": "M777.06 28.86Q788.95 27.94 809.28 27.36Q819.64 27.09 829.18 27.09Q838.28 27.09 846.59 27.33Q851.25 27.44 853.71 27.63Q856.16 27.83 857.38 28.33Q858.61 28.83 859.01 29.94Q859.32 30.55 859.32 31.18Q859.32 32.29 858.37 33.03Q857.69 33.71 856.79 33.71Q856.45 33.71 855.97 33.61Q853.50 33.32 846.17 33.07Q838.84 32.82 830.69 32.82Q817.21 32.82 802.59 33.30Q787.97 33.79 777.29 34.61Q774.45 34.85 774.10 34.85Q774.13 34.85 774.13 34.92Q774.13 36.01 768.09 52.80Q766.04 58.52 764.74 62.43Q758.65 80.72 757.15 95.96Q756.91 98.42 756.91 101.61Q756.91 104.82 757.12 106.49Q757.76 110.70 759.39 112.44Q759.73 112.81 760.34 112.81Q760.92 112.81 761.79 112.52Q764.69 111.55 771.52 103.93Q773.76 101.37 782.38 91.17Q788.13 84.23 790.95 81.01Q795.43 75.79 797.44 73.34Q798.60 71.97 800.05 71.97Q801.02 71.97 802.03 72.68Q802.98 73.63 802.98 74.77Q802.98 76.14 801.60 77.72Q796.59 83.65 795.30 85.10L789.55 91.90Q786.52 95.62 778.69 104.75Q772.31 112.18 768.75 115.08Q766.19 117.24 763.24 118.14Q762.11 118.48 761.18 118.51L760.29 118.51Q758.86 118.51 757.97 118.19Q750.87 115.34 750.87 101.40Q750.87 96.78 751.64 90.93Q753.48 77.32 759.05 60.45Q760.89 54.94 763.77 46.97Q766.59 39.09 768.04 35.43Q766.98 35.53 765.35 35.72Q755.75 36.85 746.63 38.51Q738.64 39.99 733.26 41.36Q732.60 41.52 732.23 41.52Q731.89 41.52 731.76 41.38L731.76 41.49Q731.76 44.44 727.41 44.44Q722.92 44.44 722.92 40.96Q722.92 39.17 724.72 38.17Q728.57 36.14 741.41 33.63Q754.25 31.13 767.88 29.65Q769.70 29.47 770.25 29.47Q770.47 29.47 770.47 29.49L773.50 22.48Q777.11 14.17 777.43 13.49Q779.59 8.85 782.73 3.26Q784.10 0.83 784.78-0.17Q787.29-3.65 789.37-3.65Q791.30-3.65 792.24-1.80Q792.56-1.04 792.56-0.41Q792.56 1.23 790.79 2.12Q789.32 2.81 783.33 15.18Q782.44 17.10 779.40 23.98Q777.61 28.07 777.06 28.86"}, {"char": "s", "d": "M797.07 110.36Q798.94 110.36 800.76 109.62Q801.42 109.36 802.05 109.07Q809.57 105.17 811.68 96.02Q811.81 95.28 811.81 94.22Q811.81 92.75 811.60 91.80Q811.55 91.54 811.41 91.38L808.46 93.38Q802.08 97.86 798.18 101.90Q795.07 105.04 794.09 107.14Q793.54 108.25 793.54 108.67Q793.54 108.91 793.67 109.17Q794.35 110.36 797.07 110.36M813.87 83.23Q814.13 83.07 814.66 82.78Q821.22 79.14 828.34 76.45Q832.64 74.90 837.77 73.70Q842.90 72.50 845.64 72.45Q849.04 72.47 849.04 75Q849.04 77.48 847.30 77.77Q845.56 78.06 844.95 78.11Q842 78.35 837.23 79.59Q826.36 82.46 816.61 88.16L816.77 88.63Q817.69 91.19 817.69 93.96Q817.69 98.58 815.10 103.66Q812.60 108.62 808.25 111.90Q803.90 115.19 798.86 115.87Q797.76 116 797.02 116Q794.27 116 791.93 114.90Q787.68 112.89 787.68 108.75Q787.68 104.17 794.43 97.60Q799.81 92.14 807.38 87.26Q808.72 86.37 809.15 86.21Q808.86 85.95 808.09 85.05Q804.74 81.15 800.02 77.56Q795.96 74.48 795.70 73.37Q795.54 72.79 795.22 72Q794.70 70.71 794.70 69.57Q794.70 68.38 795.25 67.41Q796.57 65.14 798.97 65.14Q800.47 65.14 801.55 66.35Q802.58 67.38 802.58 69.04Q802.58 70.10 802.13 71.44Q801.97 72 801.97 72.21Q801.97 72.16 802.03 72.16Q802.29 72.16 803.53 73.08Q806.35 75.21 809.21 77.94Q812.07 80.67 813.60 82.68Q813.87 83.04 813.87 83.23"}, {"char": "a", "d": "M848.49 77.30L847.19 78.96Q850.83 77.24 858.08 72.71Q860.11 71.44 860.35 71.26Q859.90 70.76 858.22 70.76Q855.92 70.76 852.81 73.13Q850.52 74.90 848.49 77.30M865.39 68.07Q866.31 67.30 869.87 64.80Q872.48 62.93 873.03 62.65Q873.59 62.37 874.25 62.37Q876.12 62.37 877.17 64.32Q877.62 65.17 877.62 65.91Q877.62 67.49 872.82 75.19Q867.52 83.78 867.52 87Q867.52 88.61 867.68 88.92Q868.05 89.58 869.32 89.95Q869.68 90.06 870.11 90.06Q873.51 90.06 880.05 87.03Q885.82 84.39 890.51 81.73Q892.02 80.88 897.16 78.11Q902.43 75.29 905.25 73.58Q908.71 71.52 909.82 71.52Q911.56 71.52 912.14 72.60Q912.72 73.68 912.72 74.48Q912.72 76.40 910.71 77.22Q910.05 77.51 907.28 79.14Q903.72 81.23 901.17 82.54L894.65 86.10Q889.20 89.19 883.98 91.61Q880.34 93.30 878.07 94.15Q873.61 95.81 869.97 95.81Q869 95.81 868.29 95.67Q864.09 94.83 862.17 91.35Q861.48 89.98 861.45 88.90Q861.41 87.82 861.41 87.53Q861.41 84.05 863.73 79.14Q864.70 77.11 866.36 74.34L865.55 74.90Q863.07 76.58 861.99 77.17Q853.23 82.70 849.09 84.50Q846.22 85.79 845.32 85.84Q844.42 85.89 844.32 85.89Q842.39 85.89 841.16 84.55Q839.89 83.28 839.89 81.49Q839.89 78.67 842.99 74.65Q846.09 70.63 850.41 67.67Q854.66 64.96 858.51 64.96Q862.06 64.96 864.36 66.96Q864.99 67.51 865.39 68.07"}, {"char": "l", "d": "M914.27 67.78Q928.62 56.68 936.58 47.84Q942.17 41.62 948.50 30.81Q950.71 27.09 951.90 24.77Q954.27 19.97 955.98 14.70Q957.94 8.66 957.94 5.34Q957.94 3.44 957.41 2.07Q956.75 0.30 955.56 0.30Q954.40 0.30 952.40 1.07Q949.52 2.18 946.47 4.34Q942.35 7.34 937.57 13.48Q932.78 19.61 928.30 27.70Q918.57 45.18 915.43 60.76Q915.06 62.69 914.72 64.85Q914.43 66.62 914.27 67.78M924.05 116.69Q923.37 116.69 923.05 116.66Q911.92 115.48 908.71 95.28Q907.44 88.08 907.44 80.41Q907.44 74.48 907.76 71.60Q908.34 66.86 908.79 63.98Q911.95 44.13 924.29 22.88Q929.96 12.88 936.63 5.50Q940.40 1.28 945-1.62Q949.60-4.52 953.82-5.23Q954.61-5.36 955.48-5.36Q957.25-5.36 958.38-4.97Q961.39-3.83 962.95-0.25Q963.97 2.02 963.97 5.10Q963.97 8.43 962.76 12.72Q961.28 18.08 959.35 22.64Q957.41 27.20 954.24 32.63Q946.78 45.63 939.45 53.36Q934.94 58.05 928.04 64.03Q920.97 70.13 913.53 75.48Q913.40 76.98 913.40 79.75Q913.40 81.62 913.48 83.57Q913.67 87.47 913.77 88.32Q914.75 97.13 916.32 102.06Q917.88 106.99 920.31 109.28Q922.02 110.97 923.90 110.97Q926.11 110.97 928.43 108.99Q930.54 107.14 933.86 102.66Q937.66 97.47 948.10 80.25L951.98 73.66Q952.87 71.84 954.64 71.84Q955.40 71.84 956.22 72.23Q957.80 73.03 957.80 74.58Q957.80 75.69 956.83 77.14Q948.34 91.40 942.64 100.24Q935.71 111.05 930.96 114.40Q927.75 116.66 924.05 116.69"}, {"char": "d", "d": "M978 59.50Q983.25 54.57 986.99 50.46Q1007.85 28.02 1015.15 7.53Q1017.29 1.75 1017.29-1.07Q1017.29-4.23 1015.50-4.23Q1013.62-4.23 1009.85-1.83Q996.88 6.16 987.23 27.75Q980.27 43.02 978 59.50M963.10 73.10L962.97 73.10Q961.92 73.10 960.20 73.92Q957.28 75.35 954.35 78.19Q952.06 80.57 950.05 83.84Q948.63 86.18 947.84 88.13Q951.37 85.15 957.22 78.98Q961.86 74.24 963.10 73.10M967.59 68.91Q967.72 68.75 967.98 68.52L971.17 65.64L971.51 63.30Q973.62 43.23 982.11 24.75Q987.20 13.67 993.29 5.68Q997.20 0.67 1002.14-3.35Q1007.08-7.37 1011.57-9.16Q1013.73-9.95 1015.57-9.95Q1018.45-9.95 1020.53-8.08Q1023.09-5.84 1023.19-1.65L1023.22-0.70Q1023.22 1.65 1022.13 5.29Q1021.03 8.93 1019.12 13.51Q1017.21 18.10 1015.21 21.95Q1009.67 32.31 1001.26 42.83Q991.08 55.68 979.13 66.28Q977.03 68.17 977.03 68.20Q976.84 69.25 976.71 76.48Q976.71 91.51 978.48 99.45Q979.50 104.19 980.93 105.88Q982.64 107.96 983.59 108.30Q984.54 108.65 985.01 108.65Q986.62 108.65 989.73 106.09Q991.24 104.75 993.93 101.61Q1000.81 93.62 1008.38 80.59Q1011.62 75.03 1012.09 73.50Q1012.70 71.87 1014.55 71.87Q1015.18 71.87 1015.84 72.16Q1017.58 73.10 1017.58 74.90Q1017.58 75.66 1017.26 76.61Q1015.39 80.51 1011.79 86.42Q1008.19 92.33 1004.61 97.49Q1001.68 101.61 998.48 105.34Q995.27 109.07 992.92 110.99Q988.68 114.34 985.04 114.34Q980.90 114.34 977.10 110.33Q974.47 107.46 972.95 101.69Q971.44 95.91 971.17 89.79Q970.80 83.28 970.80 76.03Q970.80 74.66 970.83 73.76Q970.72 73.84 970.64 73.92Q970.72 76.03 970.72 76.69Q970.72 77.56 970.43 78.22Q969.54 79.83 967.69 79.83Q966.66 79.83 965.87 79.14L965.42 78.85L961.55 82.89Q951.50 93.38 947.65 95.33Q946.33 95.94 945.20 95.94Q942.99 95.94 941.67 93.93Q941.11 93.09 941.11 91.01Q941.11 89.77 941.59 88.24Q942.91 83.81 945.91 79.41Q950.50 72.63 956.78 69.25Q960.28 67.38 963.08 67.38Q965.63 67.38 967.59 68.91"}, {"char": "a", "d": "M1015.39 77.30L1014.10 78.96Q1017.74 77.24 1024.99 72.71Q1027.02 71.44 1027.26 71.26Q1026.81 70.76 1025.12 70.76Q1022.83 70.76 1019.71 73.13Q1017.42 74.90 1015.39 77.30M1032.29 68.07Q1033.21 67.30 1036.77 64.80Q1039.38 62.93 1039.94 62.65Q1040.49 62.37 1041.15 62.37Q1043.02 62.37 1044.08 64.32Q1044.53 65.17 1044.53 65.91Q1044.53 67.49 1039.73 75.19Q1034.43 83.78 1034.43 87Q1034.43 88.61 1034.59 88.92Q1034.95 89.58 1036.22 89.95Q1036.59 90.06 1037.01 90.06Q1040.41 90.06 1046.95 87.03Q1052.73 84.39 1057.42 81.73Q1058.92 80.88 1064.06 78.11Q1069.34 75.29 1072.16 73.58Q1075.61 71.52 1076.72 71.52Q1078.46 71.52 1079.04 72.60Q1079.62 73.68 1079.62 74.48Q1079.62 76.40 1077.62 77.22Q1076.96 77.51 1074.19 79.14Q1070.63 81.23 1068.07 82.54L1061.56 86.10Q1056.10 89.19 1050.88 91.61Q1047.24 93.30 1044.97 94.15Q1040.52 95.81 1036.88 95.81Q1035.90 95.81 1035.19 95.67Q1031 94.83 1029.07 91.35Q1028.39 89.98 1028.35 88.90Q1028.31 87.82 1028.31 87.53Q1028.31 84.05 1030.63 79.14Q1031.61 77.11 1033.27 74.34L1032.45 74.90Q1029.97 76.58 1028.89 77.17Q1020.14 82.70 1016 84.50Q1013.12 85.79 1012.23 85.84Q1011.33 85.89 1011.22 85.89Q1009.30 85.89 1008.06 84.55Q1006.79 83.28 1006.79 81.49Q1006.79 78.67 1009.89 74.65Q1012.99 70.63 1017.31 67.67Q1021.56 64.96 1025.41 64.96Q1028.97 64.96 1031.26 66.96Q1031.90 67.51 1032.29 68.07"}, {"char": "s", "d": "M1074.95 110.36Q1076.83 110.36 1078.64 109.62Q1079.30 109.36 1079.94 109.07Q1087.45 105.17 1089.56 96.02Q1089.69 95.28 1089.69 94.22Q1089.69 92.75 1089.48 91.80Q1089.43 91.54 1089.30 91.38L1086.34 93.38Q1079.96 97.86 1076.06 101.90Q1072.95 105.04 1071.97 107.14Q1071.42 108.25 1071.42 108.67Q1071.42 108.91 1071.55 109.17Q1072.24 110.36 1074.95 110.36M1091.75 83.23Q1092.01 83.07 1092.54 82.78Q1099.11 79.14 1106.22 76.45Q1110.52 74.90 1115.65 73.70Q1120.78 72.50 1123.52 72.45Q1126.92 72.47 1126.92 75Q1126.92 77.48 1125.18 77.77Q1123.44 78.06 1122.84 78.11Q1119.88 78.35 1115.11 79.59Q1104.25 82.46 1094.49 88.16L1094.65 88.63Q1095.57 91.19 1095.57 93.96Q1095.57 98.58 1092.99 103.66Q1090.48 108.62 1086.13 111.90Q1081.78 115.19 1076.75 115.87Q1075.64 116 1074.90 116Q1072.16 116 1069.81 114.90Q1065.57 112.89 1065.57 108.75Q1065.57 104.17 1072.32 97.60Q1077.70 92.14 1085.26 87.26Q1086.61 86.37 1087.03 86.21Q1086.74 85.95 1085.97 85.05Q1082.63 81.15 1077.91 77.56Q1073.85 74.48 1073.58 73.37Q1073.42 72.79 1073.11 72Q1072.58 70.71 1072.58 69.57Q1072.58 68.38 1073.13 67.41Q1074.45 65.14 1076.85 65.14Q1078.35 65.14 1079.44 66.35Q1080.46 67.38 1080.46 69.04Q1080.46 70.10 1080.02 71.44Q1079.86 72 1079.86 72.21Q1079.86 72.16 1079.91 72.16Q1080.17 72.16 1081.41 73.08Q1084.23 75.21 1087.10 77.94Q1089.96 80.67 1091.49 82.68Q1091.75 83.04 1091.75 83.23"}, {"char": " ", "d": ""}, {"char": "S", "d": "M1193.63 166.39Q1194.63 166.39 1196.77 166.26Q1202.10 165.94 1204.57 165.57Q1223.45 162.88 1239.09 155.58Q1241.12 154.61 1243.95 153.04Q1246.79 151.47 1248.53 150.33Q1259.87 142.79 1264.06 134.38Q1266.27 129.98 1266.27 126.10Q1266.27 119.27 1258.21 112.13Q1252.80 107.22 1243.41 103.03L1241.80 102.29L1239.46 103.66Q1216.44 117.11 1201.75 129.13Q1194.29 135.38 1188.60 141.84Q1181.11 150.36 1179.74 155.53Q1179.37 156.98 1179.37 158.59Q1179.37 159.43 1179.47 160.09Q1179.58 160.75 1179.96 161.49Q1180.34 162.23 1181.31 163.11Q1182.27 163.99 1183.22 164.52Q1186.70 166.29 1193.63 166.39M1248 98.89L1248.55 99.16Q1257.44 103.37 1262.90 108.52Q1272.10 117.06 1272.10 125.92Q1272.10 129.74 1270.52 133.83Q1267.59 141.71 1259.58 148.83Q1251.80 155.82 1240.22 161.12Q1228.65 166.42 1214.70 169.42Q1202.76 171.96 1194.19 171.96Q1186.41 171.96 1181.53 169.98Q1177.28 168.08 1175.25 165.05Q1173.49 162.12 1173.49 158.67Q1173.49 154.34 1176.26 149.20Q1179.02 144.06 1185.46 137.10Q1189.39 132.83 1192.84 129.58Q1206.16 117.11 1233.74 100.63Q1234.63 100.10 1235.21 99.76Q1231.07 98.23 1226.64 96.91Q1220.24 95.02 1202.41 90.96Q1191.34 88.48 1186.45 87.12Q1181.56 85.76 1178.29 84.34Q1166.21 79.35 1165 70.31Q1164.89 69.44 1164.89 68.09Q1164.89 64.88 1165.31 62.90Q1167.16 54.20 1178.13 41.67Q1186.64 31.97 1199.51 21.42Q1209.48 13.30 1221.24 5.84Q1233-1.62 1244.13-6.89Q1260.47-14.62 1271.65-16.73Q1275.13-17.36 1279.38-17.36Q1280.41-17.36 1281.22-17.31Q1287.74-16.60 1291.53-13.09Q1296.89-8.13 1296.89-0.59Q1296.89 2.70 1296.33 5.45Q1293.91 17.68 1284.68 33.50Q1281.94 38.27 1279.83 41.15Q1276.87 45.18 1272.73 48.74Q1271.47 49.85 1270.39 49.85Q1269.83 49.85 1269.28 49.61Q1267.67 48.90 1267.67 47.21Q1267.67 46.61 1267.99 46Q1268.30 45.39 1269.91 43.84Q1273.16 40.78 1275.61 37.38Q1278.06 33.98 1281.62 27.49Q1286.42 18.87 1289 10.75Q1291.11 4.21 1291.11-0.04Q1291.11-3.18 1289.98-5.50Q1287.02-11.80 1278.53-11.80Q1275.79-11.80 1272.97-11.35Q1264.98-10.03 1252.67-4.73Q1243.04-0.59 1233.84 4.63Q1222.58 11.14 1211.59 19.05Q1203.73 24.80 1195.93 31.76Q1188.12 38.72 1182.85 44.76Q1176.20 52.33 1173.28 57.94Q1170.64 62.95 1170.64 67.09L1170.67 67.86Q1170.77 72.31 1173.88 75.03Q1178.10 79.22 1190.20 82.31Q1193.58 83.18 1201.94 85.08Q1213.83 87.79 1218.47 88.92Q1230.76 91.90 1239.91 95.44Q1241.51 96.02 1241.62 96.12L1242.91 95.38Q1249.82 91.80 1255.87 89.20Q1261.92 86.60 1271.86 82.65Q1279.51 79.64 1291.01 76.44Q1302.50 73.24 1309.23 72.13Q1310.89 71.84 1311.55 71.84Q1312.36 71.84 1312.96 72.12Q1313.55 72.39 1313.96 73.06Q1314.37 73.74 1314.37 74.45Q1314.37 75.19 1313.95 75.90Q1313.63 76.43 1313.09 76.76Q1312.55 77.09 1311.70 77.28Q1310.86 77.48 1309.44 77.72Q1296.52 79.85 1274.21 87.61Q1264.77 91.06 1258.81 93.72Q1253.30 96.18 1248 98.89"}, {"char": "w", "d": "M1356.21 77.96Q1353.13 85.60 1349.09 92.09Q1344.85 98.87 1340.63 102.61Q1335.49 107.17 1330.79 107.17Q1327.71 107.17 1325.05 105.30Q1323.31 104.06 1322.33 102.50Q1320.67 99.68 1319.69 92.27Q1319.40 90.03 1319.35 89.19Q1319.03 89.48 1318.35 89.98Q1315.92 91.64 1314.68 92.35Q1311.86 93.93 1309.54 93.93Q1305.98 93.93 1304.48 90.74Q1303.98 89.53 1303.98 87.95Q1303.98 86.13 1304.61 83.78Q1305.72 79.56 1308.54 75.06Q1309.57 73.42 1310.23 72.68Q1311.28 71.47 1312.68 71.47Q1313.60 71.47 1314.34 71.97Q1315.74 72.87 1315.74 74.50Q1315.74 75.06 1315.53 75.57Q1315.32 76.08 1314.58 76.82Q1313 78.59 1311.60 81.86Q1310.02 85.50 1309.99 88.19Q1311.26 87.76 1314.82 85.37Q1317.64 83.41 1318.61 82.98Q1319.59 82.54 1320.54 82.54Q1322.88 82.54 1324.26 85.05Q1324.94 86.42 1325.51 90.63Q1326.07 94.83 1326.56 96.89Q1327.05 98.94 1327.60 99.81Q1328.66 101.37 1330.98 101.37Q1331.90 101.37 1332.75 101.03Q1333.88 100.55 1335.51 99.26Q1341.84 94.22 1347.80 82.25Q1350.09 77.59 1352.36 71.05Q1353.63 67.41 1353.97 66.80Q1354.81 65.25 1356.37 65.25Q1357.32 65.25 1357.93 65.54Q1360.17 66.67 1360.17 69.97Q1360.17 72.50 1361.25 74.69Q1363.33 79.27 1369.87 79.27Q1373.06 79.27 1376.94 78.04Q1382.37 76.32 1387.54 72.71Q1388.49 72 1389.51 72Q1390.23 72 1390.88 72.37Q1392.39 73.16 1392.39 74.84Q1392.39 75.64 1391.89 76.43Q1391.33 77.19 1389.57 78.33Q1387.80 79.46 1385.64 80.61Q1383.48 81.75 1381.55 82.52Q1374.99 85.02 1369.79 85.02Q1368.89 85.02 1368.02 84.94Q1359.56 84.07 1356.21 77.96"}, {"char": "a", "d": "M1391.17 77.30L1389.88 78.96Q1393.52 77.24 1400.77 72.71Q1402.80 71.44 1403.04 71.26Q1402.59 70.76 1400.90 70.76Q1398.61 70.76 1395.50 73.13Q1393.21 74.90 1391.17 77.30M1408.08 68.07Q1409 67.30 1412.56 64.80Q1415.17 62.93 1415.72 62.65Q1416.28 62.37 1416.94 62.37Q1418.81 62.37 1419.86 64.32Q1420.31 65.17 1420.31 65.91Q1420.31 67.49 1415.51 75.19Q1410.21 83.78 1410.21 87Q1410.21 88.61 1410.37 88.92Q1410.74 89.58 1412.01 89.95Q1412.37 90.06 1412.80 90.06Q1416.20 90.06 1422.74 87.03Q1428.51 84.39 1433.20 81.73Q1434.71 80.88 1439.85 78.11Q1445.12 75.29 1447.94 73.58Q1451.40 71.52 1452.51 71.52Q1454.25 71.52 1454.83 72.60Q1455.41 73.68 1455.41 74.48Q1455.41 76.40 1453.40 77.22Q1452.74 77.51 1449.97 79.14Q1446.41 81.23 1443.86 82.54L1437.34 86.10Q1431.89 89.19 1426.67 91.61Q1423.03 93.30 1420.76 94.15Q1416.30 95.81 1412.66 95.81Q1411.69 95.81 1410.98 95.67Q1406.78 94.83 1404.86 91.35Q1404.17 89.98 1404.13 88.90Q1404.09 87.82 1404.09 87.53Q1404.09 84.05 1406.42 79.14Q1407.39 77.11 1409.05 74.34L1408.23 74.90Q1405.76 76.58 1404.67 77.17Q1395.92 82.70 1391.78 84.50Q1388.91 85.79 1388.01 85.84Q1387.11 85.89 1387.01 85.89Q1385.08 85.89 1383.84 84.55Q1382.58 83.28 1382.58 81.49Q1382.58 78.67 1385.68 74.65Q1388.78 70.63 1393.10 67.67Q1397.34 64.96 1401.19 64.96Q1404.75 64.96 1407.05 66.96Q1407.68 67.51 1408.08 68.07"}, {"char": "m", "d": "M1446.12 99.05L1445.91 99.05Q1441.93 99.05 1441.93 94.54Q1441.93 88.90 1448.92 76.14Q1451.45 71.42 1453.38 69.47Q1455.27 67.30 1456.96 67.30Q1458.49 67.30 1459.22 68.23Q1459.94 69.15 1459.94 70.13Q1459.94 71.52 1458.57 72.45Q1456.46 73.84 1452.35 82.07Q1449.39 87.90 1448.37 91.43L1451.53 88.19Q1456.04 83.68 1461.15 78.04Q1473.78 64.09 1478.90 58.84Q1481.96 55.75 1484.90 53.09Q1487.84 50.43 1489.55 49.24Q1491.26 48.06 1492.74 48.06Q1493.72 48.06 1494.51 48.56Q1496.12 49.51 1496.12 51.48Q1496.12 52.46 1495.69 53.67Q1495.40 54.54 1492.17 62.77Q1488.94 71 1488.31 72.87Q1486.31 78.93 1486.31 81.81Q1486.31 82.52 1486.49 83.23L1486.52 83.39L1494.80 78.27Q1500.81 74.42 1503.34 74.08Q1503.89 74 1504.76 74Q1506.14 74 1506.62 74.20Q1507.11 74.40 1507.45 74.55Q1509.09 75.42 1511.51 79.17Q1513.49 82.15 1514.15 82.86Q1515.02 83.81 1517 84.13Q1518.08 84.31 1519.08 84.31Q1523.64 84.31 1532.24 79.51Q1537.12 76.80 1544.82 73.08Q1547.40 71.84 1548.19 71.84Q1549.77 71.84 1550.49 72.95Q1550.99 73.74 1550.99 74.48Q1550.99 74.84 1550.91 75.19Q1550.56 76.77 1547.64 78.04Q1545.77 78.85 1541.94 80.78Q1538.12 82.70 1535.69 84.05Q1531.71 86.26 1528.81 87.53Q1523.30 89.90 1519.08 89.90Q1514.52 89.90 1511.54 88.08Q1509.67 86.89 1507.80 84.02Q1505.24 80.09 1504.74 79.67Q1504.66 79.59 1504.66 79.56Q1504.66 79.54 1504.71 79.54Q1503.95 79.54 1501.94 80.59Q1499.94 81.65 1495.33 84.63Q1491.26 87.26 1489.39 88.27Q1487.28 89.37 1485.67 89.37Q1483.72 89.37 1482.46 87.92Q1480.48 85.76 1480.48 81.65Q1480.48 78.14 1482.27 72.50Q1483.12 69.81 1486.52 61.29L1487.68 58.29Q1487.42 58.55 1487.13 58.81Q1481.06 64.56 1465.66 81.59Q1461.39 86.37 1457.11 90.72Q1452.82 95.07 1450.95 96.60Q1449.24 97.97 1448.22 98.51Q1447.21 99.05 1446.12 99.05"}, {"char": "i", "d": "M1549.96 94.75Q1546.90 94.75 1544.58 92.83Q1541.97 90.69 1541.97 87Q1541.97 85.44 1542.58 82.89Q1543 80.96 1543.66 79.06Q1544.71 76.24 1546.21 73.03Q1548.64 67.83 1549.96 67.09Q1550.62 66.67 1551.38 66.67Q1553.94 66.67 1554.68 69.10Q1554.84 69.60 1554.84 70.07Q1554.84 71.39 1554.07 71.85Q1553.31 72.31 1551.57 76.03Q1547.93 83.73 1547.93 87.84Q1547.93 88.61 1548.24 88.87Q1548.56 89.14 1549.17 89.14Q1549.85 89.14 1551.09 88.79Q1553.33 88.24 1556.09 86.88Q1558.84 85.52 1565.04 81.88Q1569.68 79.20 1576.62 74.77Q1578.22 73.76 1580.81 72.21Q1581.68 71.76 1582.50 71.76Q1583.71 71.76 1584.79 72.76Q1585.40 73.87 1585.40 74.77Q1585.40 76.35 1584.05 77.27Q1582.86 77.85 1576.11 82.20Q1573.93 83.60 1570.16 85.81Q1563.19 89.85 1560.58 91.27Q1553.57 94.75 1549.96 94.75M1554.15 58.37Q1553.07 58.37 1552.20 57.60Q1551.04 56.70 1551.04 55.15Q1551.04 54.52 1551.59 53.41Q1552.17 52.17 1552.88 51.62Q1553.60 51.06 1554.70 51.06Q1556.15 51.06 1557.33 52.12Q1558.50 53.17 1558.50 54.30Q1558.50 54.81 1558.32 55.25Q1557.95 56.28 1556.89 56.68Q1556.02 58.37 1554.15 58.37"}];
  const svgWidth = 1592;
  const svgHeight = 141;

  function renderSignature() {
    if (!signatureSvg || !signaturePaths || signaturePaths.length === 0) return;

    signatureSvg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
    signatureSvg.innerHTML = '';

    const maskId = 'signature-mask';

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
    mask.setAttribute('id', maskId);
    mask.setAttribute('maskUnits', 'userSpaceOnUse');

    const strokeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    strokeGroup.setAttribute('class', 'sig-stroke-group');

    const fillGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    fillGroup.setAttribute('mask', `url(#${maskId})`);

    signaturePaths.forEach((item, index) => {
      if (!item.d || item.d.trim() === '') return;

      const maskPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      maskPath.setAttribute('d', item.d);
      maskPath.setAttribute('stroke', '#ffffff');
      maskPath.setAttribute('stroke-width', '42');
      maskPath.setAttribute('fill', 'none');
      maskPath.setAttribute('stroke-linecap', 'round');
      maskPath.setAttribute('stroke-linejoin', 'round');
      maskPath.setAttribute('class', 'sig-mask-path');

      const fillPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      fillPath.setAttribute('d', item.d);
      fillPath.setAttribute('fill', '#ffffff');

      strokeGroup.appendChild(maskPath);
      fillGroup.appendChild(fillPath);
    });

    mask.appendChild(strokeGroup);
    defs.appendChild(mask);
    signatureSvg.appendChild(defs);
    signatureSvg.appendChild(fillGroup);

    const maskPaths = strokeGroup.querySelectorAll('.sig-mask-path');
    let delay = 0.4;
    maskPaths.forEach((mp) => {
      const len = mp.getTotalLength ? mp.getTotalLength() : 300;
      mp.style.strokeDasharray = `${len} ${len}`;
      mp.style.strokeDashoffset = `${len}`;
      // Slower, graceful calligraphy animation so every stroke is clearly visible
      mp.style.transition = `stroke-dashoffset 1.4s cubic-bezier(0.25, 1, 0.5, 1) ${delay}s`;
      delay += 0.14;
    });

    setTimeout(() => {
      maskPaths.forEach((mp) => {
        mp.style.strokeDashoffset = '0';
      });
    }, 500);
  }

  const flyerCard = document.querySelector('.flyer-card');
  if (flyerCard && 'IntersectionObserver' in window) {
    const sigObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          renderSignature();
          sigObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    sigObserver.observe(flyerCard);
  } else {
    setTimeout(renderSignature, 600);
  }


  // =========================================================================
  // 5. Live Google Sheets Synced Countdown Timer & Event Details (Card 0)
  // =========================================================================
  let targetTimestamp = new Date('2026-12-13T17:30:00+07:00').getTime();
  if (targetTimestamp - Date.now() <= 0) {
    targetTimestamp = Date.now() + (21 * 24 * 60 * 60 * 1000) + (14 * 60 * 60 * 1000) + (35 * 60 * 1000);
  }

  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minutesEl = document.getElementById('cd-minutes');
  const secondsEl = document.getElementById('cd-seconds');

  function updateCountdown() {
    const now = Date.now();
    let distance = targetTimestamp - now;

    if (distance < 0) {
      distance = 0;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const pad = (n) => String(Math.max(0, n)).padStart(2, '0');

    if (daysEl && daysEl.textContent !== pad(days)) daysEl.textContent = pad(days);
    if (hoursEl && hoursEl.textContent !== pad(hours)) hoursEl.textContent = pad(hours);
    if (minutesEl && minutesEl.textContent !== pad(minutes)) minutesEl.textContent = pad(minutes);
    if (secondsEl && secondsEl.textContent !== pad(seconds)) secondsEl.textContent = pad(seconds);
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Apply Live Event Settings & Countdown Target from Google Sheets
  function applyEventSettings(res) {
    if (!res || !res.success) return;

    if (res.eventDate) {
      const dateEl = document.getElementById('eventDateDisplay');
      if (dateEl) dateEl.textContent = res.eventDate;
    }

    if (res.startTime || res.doorsOpen) {
      const timeEl = document.getElementById('eventTimeDisplay');
      if (timeEl) {
        const doors = res.doorsOpen ? ` Doors Open at ${res.doorsOpen}` : '';
        timeEl.textContent = `${res.startTime || '5:30 PM'} ICT${doors}`;
      }
    }

    if (res.venueName) {
      const vNameEl = document.getElementById('venueNameDisplay');
      if (vNameEl) vNameEl.textContent = res.venueName;
    }

    if (res.venueAddress) {
      const vAddrEl = document.getElementById('venueAddressDisplay');
      if (vAddrEl) vAddrEl.textContent = res.venueAddress;
    }

    if (res.countdownTarget) {
      const parsed = new Date(res.countdownTarget).getTime();
      if (!isNaN(parsed) && parsed > 0) {
        targetTimestamp = parsed;
        updateCountdown();
      }
    }
  }

  // Fetch live settings on page load
  if (APPS_SCRIPT_WEB_APP_URL) {
    fetch(APPS_SCRIPT_WEB_APP_URL + "?action=getSettings")
      .then(res => res.json())
      .then(data => applyEventSettings(data))
      .catch(err => console.log("Using default event settings:", err));
  }


  // =========================================================================
  // 6. Event Location Share Button & Google Map Integration (Card 0)
  // =========================================================================
  const mapShareBtn = document.getElementById('mapShareBtn');
  const toastNotification = document.getElementById('toastNotification');

  function showToast(message) {
    if (!toastNotification) return;
    toastNotification.querySelector('span').textContent = message;
    toastNotification.classList.add('is-visible');
    setTimeout(() => {
      toastNotification.classList.remove('is-visible');
    }, 2800);
  }

  if (mapShareBtn) {
    mapShareBtn.addEventListener('click', async (e) => {
      e.preventDefault();

      const shareData = {
        title: 'Event Location: Dr. Gnanvatsaldas Swami in Bangkok',
        text: 'The Tio Chew Association of Thailand\nNo. 1, Chan Road, Soi Yenchit 12, Thung Wat Don, Sathorn, Bangkok 10120, Thailand',
        url: 'https://www.google.com/maps/search/?api=1&query=The+Tio+Chew+Association+of+Thailand+Bangkok',
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          if (err.name !== 'AbortError') {
            copyLocationToClipboard();
          }
        }
      } else {
        copyLocationToClipboard();
      }
    });
  }

  function copyLocationToClipboard() {
    const textToCopy = `The Tio Chew Association of Thailand\nNo. 1, Chan Road, Soi Yenchit 12, Thung Wat Don, Sathorn, Bangkok 10120, Thailand\nhttps://maps.google.com/?q=13.71273,100.52468`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('Address copied to clipboard!');
      }).catch(() => {
        fallbackCopyText(textToCopy);
      });
    } else {
      fallbackCopyText(textToCopy);
    }
  }

  function fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('Address copied to clipboard!');
    } catch (err) {
      showToast('Address ready to share');
    }
    document.body.removeChild(textArea);
  }


  // =========================================================================
  // 7. Registration Form Management & Google Sheets Connection (Card 1)
  // Architecture identical to Kids Diwali with Adults + Children split
  // =========================================================================

  // Stepper Elements & Container References
  const form = document.getElementById('registration-form');
  const regSuccess = document.getElementById('regSuccess');
  const newRegBtn = document.getElementById('newRegBtn');
  const adultsBlock = document.getElementById('adultsBlock');
  const childrenBlock = document.getElementById('childrenBlock');
  const additionalAdultsList = document.getElementById('additionalAdultsList');
  const childrenList = document.getElementById('childrenList');
  const attendeeBadgesContainer = document.getElementById('attendeeBadgesContainer');

  const adultDecBtn = document.getElementById('adultDecBtn');
  const adultIncBtn = document.getElementById('adultIncBtn');
  const adultCountDisplay = document.getElementById('adultCountDisplay');

  const childDecBtn = document.getElementById('childDecBtn');
  const childIncBtn = document.getElementById('childIncBtn');
  const childCountDisplay = document.getElementById('childCountDisplay');

  let adultCount = 0;
  let childCount = 0;

  function setAdultCount(newCount) {
    newCount = Math.max(0, Math.min(15, newCount));
    while (adultCount < newCount) {
      adultCount++;
      const currentId = adultCount;
      const div = document.createElement('div');
      div.className = 'attendee-card';
      div.id = `adultCard-${currentId}`;
      div.innerHTML = `
        <div class="attendee-card-header">
          <span class="attendee-title-clean">Adult ${currentId + 1}</span>
          <button type="button" class="btn-remove-attendee" onclick="removeAdultByIndex(${currentId})" title="Remove attendee">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            <span>Remove</span>
          </button>
        </div>
        <div class="form-group">
          <label>Full Name</label>
          <div class="input-wrapper">
            <input type="text" class="additional-adult-name" placeholder="Tap to write">
          </div>
        </div>
        <div class="form-group">
          <label>Gender</label>
          <div class="gender-selector">
            <label class="gender-option">
              <input type="radio" name="adultGender_${currentId}" value="Male" checked>
              <span class="gender-btn">Male</span>
            </label>
            <label class="gender-option">
              <input type="radio" name="adultGender_${currentId}" value="Female">
              <span class="gender-btn">Female</span>
            </label>
          </div>
        </div>
        <div class="form-group">
          <label>Mobile Number (WhatsApp) <span style="font-weight:400; color:#ffedd5;">(Optional)</span></label>
          <div class="input-wrapper">
            <input type="tel" class="additional-adult-phone" placeholder="000 000 0000">
          </div>
        </div>
        <div class="form-group">
          <label>Email Address <span style="font-weight:400; color:#ffedd5;">(Optional)</span></label>
          <div class="input-wrapper">
            <input type="email" class="additional-adult-email" placeholder="Tap to type">
          </div>
        </div>
      `;
      if (additionalAdultsList) additionalAdultsList.appendChild(div);
    }

    while (adultCount > newCount) {
      const card = document.getElementById(`adultCard-${adultCount}`);
      if (card) card.remove();
      adultCount--;
    }

    if (adultCountDisplay) adultCountDisplay.textContent = String(adultCount);
    if (adultsBlock) adultsBlock.style.display = adultCount > 0 ? 'block' : 'none';
  }

  function setChildCount(newCount) {
    newCount = Math.max(0, Math.min(15, newCount));
    while (childCount < newCount) {
      childCount++;
      const currentId = childCount;
      const div = document.createElement('div');
      div.className = 'attendee-card';
      div.id = `childCard-${currentId}`;
      div.innerHTML = `
        <div class="attendee-card-header">
          <span class="attendee-title-clean">Child ${currentId} (12 &amp; Under)</span>
          <button type="button" class="btn-remove-attendee" onclick="removeChildByIndex(${currentId})" title="Remove child">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            <span>Remove</span>
          </button>
        </div>
        <div class="form-group">
          <label>Child's Full Name</label>
          <div class="input-wrapper">
            <input type="text" class="child-attendee-name" placeholder="Tap to write">
          </div>
        </div>
        <div class="form-group">
          <label>Gender</label>
          <div class="gender-selector">
            <label class="gender-option">
              <input type="radio" name="childGender_${currentId}" value="Male" checked>
              <span class="gender-btn">Male</span>
            </label>
            <label class="gender-option">
              <input type="radio" name="childGender_${currentId}" value="Female">
              <span class="gender-btn">Female</span>
            </label>
          </div>
        </div>
      `;
      if (childrenList) childrenList.appendChild(div);
    }

    while (childCount > newCount) {
      const card = document.getElementById(`childCard-${childCount}`);
      if (card) card.remove();
      childCount--;
    }

    if (childCountDisplay) childCountDisplay.textContent = String(childCount);
    if (childrenBlock) childrenBlock.style.display = childCount > 0 ? 'block' : 'none';
  }

  window.removeAdultByIndex = function(id) {
    const card = document.getElementById(`adultCard-${id}`);
    if (card) {
      card.remove();
      adultCount = Math.max(0, adultCount - 1);
      if (adultCountDisplay) adultCountDisplay.textContent = String(adultCount);
      if (adultsBlock) adultsBlock.style.display = adultCount > 0 ? 'block' : 'none';
    }
  };

  window.removeChildByIndex = function(id) {
    const card = document.getElementById(`childCard-${id}`);
    if (card) {
      card.remove();
      childCount = Math.max(0, childCount - 1);
      if (childCountDisplay) childCountDisplay.textContent = String(childCount);
      if (childrenBlock) childrenBlock.style.display = childCount > 0 ? 'block' : 'none';
    }
  };

  if (adultIncBtn) adultIncBtn.addEventListener('click', () => setAdultCount(adultCount + 1));
  if (adultDecBtn) adultDecBtn.addEventListener('click', () => setAdultCount(adultCount - 1));
  if (childIncBtn) childIncBtn.addEventListener('click', () => setChildCount(childCount + 1));
  if (childDecBtn) childDecBtn.addEventListener('click', () => setChildCount(childCount - 1));

  // Dispatch payload to Google Apps Script / Google Sheets
  async function submitToGoogleSheets(payload) {
    try {
      const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (err) {
      console.warn("Direct JSON response blocked by CORS/redirect, dispatching via no-cors fallback:", err);
      try {
        await fetch(APPS_SCRIPT_WEB_APP_URL, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify(payload)
        });
      } catch (e2) {
        console.warn("no-cors dispatch completed:", e2);
      }
      return { success: true };
    }
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      let isValid = true;
      const nameInput = document.getElementById('fullName');
      const phoneInput = document.getElementById('phoneNumber');
      const emailInput = document.getElementById('emailAddress');
      const countryCode = document.getElementById('countryCode')?.value || '+66';
      const nameError = document.getElementById('nameError');
      const phoneError = document.getElementById('phoneError');
      const emailError = document.getElementById('emailError');

      if (nameError) nameError.textContent = '';
      if (phoneError) phoneError.textContent = '';
      if (emailError) emailError.textContent = '';

      if (!nameInput.value.trim()) {
        if (nameError) nameError.textContent = 'Please enter your full name.';
        isValid = false;
      }

      const phoneRegex = /^[0-9\s\-\+]{7,16}$/;
      if (!phoneInput.value.trim() || !phoneRegex.test(phoneInput.value.trim())) {
        if (phoneError) phoneError.textContent = 'Please enter a valid mobile number.';
        isValid = false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
        if (emailError) emailError.textContent = 'Please enter a valid email address.';
        isValid = false;
      }

      // Collect primary registrant gender
      const primaryGender = document.querySelector('input[name="primaryGender"]:checked')?.value || 'Male';

      // Collect additional adults
      const additionalAdults = [];
      const adultCards = additionalAdultsList.querySelectorAll('.attendee-card');
      adultCards.forEach((c) => {
        const aName = c.querySelector('.additional-adult-name')?.value.trim();
        const aPhone = c.querySelector('.additional-adult-phone')?.value.trim();
        const aEmail = c.querySelector('.additional-adult-email')?.value.trim();
        const aGender = c.querySelector('input[type="radio"]:checked')?.value || 'Male';
        if (aName) {
          additionalAdults.push({ name: aName, gender: aGender, phone: aPhone || '', email: aEmail || '' });
        }
      });

      // Collect children
      const children = [];
      const childCards = childrenList.querySelectorAll('.attendee-card');
      childCards.forEach((c) => {
        const chName = c.querySelector('.child-attendee-name')?.value.trim();
        const chGender = c.querySelector('input[type="radio"]:checked')?.value || 'Male';
        if (chName) {
          children.push({ name: chName, gender: chGender });
        }
      });

      // Validate All 3 Consent Checkboxes (Terms, Updates, Photography)
      const termsConsentCheck = document.getElementById('termsConsent');
      const termsConsentError = document.getElementById('termsConsentError');
      if (termsConsentCheck && !termsConsentCheck.checked) {
        if (termsConsentError) termsConsentError.style.display = 'block';
        isValid = false;
        termsConsentCheck.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (termsConsentError) {
        termsConsentError.style.display = 'none';
      }

      const marketingConsentCheck = document.getElementById('marketingConsent');
      const marketingConsentError = document.getElementById('marketingConsentError');
      if (marketingConsentCheck && !marketingConsentCheck.checked) {
        if (marketingConsentError) marketingConsentError.style.display = 'block';
        isValid = false;
        if (!termsConsentCheck || termsConsentCheck.checked) {
          marketingConsentCheck.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else if (marketingConsentError) {
        marketingConsentError.style.display = 'none';
      }

      const photoConsentCheck = document.getElementById('photoConsent');
      const photoConsentError = document.getElementById('photoConsentError');
      if (photoConsentCheck && !photoConsentCheck.checked) {
        if (photoConsentError) photoConsentError.style.display = 'block';
        isValid = false;
        if ((!termsConsentCheck || termsConsentCheck.checked) && (!marketingConsentCheck || marketingConsentCheck.checked)) {
          photoConsentCheck.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else if (photoConsentError) {
        photoConsentError.style.display = 'none';
      }

      if (!isValid) return;

      const submitBtn = document.getElementById('submitBtn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="btn-text">Registering &amp; Generating Pass...</span>';
      }

      // Generate Group Pass ID & Individual Badges
      const now = new Date();
      const mmdd = ("0" + (now.getMonth() + 1)).slice(-2) + ("0" + now.getDate()).slice(-2);
      const randNum = Math.floor(1000 + Math.random() * 9000);
      const groupRegId = `GS-${mmdd}-${randNum}`;

      const rawUserPhone = phoneInput.value.trim();
      const displayPhone = `${countryCode} ${rawUserPhone}`;
      const sheetSafePrimaryPhone = displayPhone.startsWith("'") ? displayPhone : `'${displayPhone}`;

      const primaryAttendee = {
        name: nameInput.value.trim(),
        gender: primaryGender,
        phone: displayPhone,
        email: emailInput.value.trim(),
        role: 'Primary Registrant',
        badgeId: `${groupRegId}-A1`
      };

      const allAttendees = [primaryAttendee];
      additionalAdults.forEach((a, idx) => {
        allAttendees.push({
          name: a.name,
          gender: a.gender,
          phone: a.phone,
          email: a.email,
          role: 'Adult Attendee',
          badgeId: `${groupRegId}-A${idx + 2}`
        });
      });
      children.forEach((ch, idx) => {
        allAttendees.push({
          name: ch.name,
          gender: ch.gender,
          role: 'Child (12 & Under)',
          badgeId: `${groupRegId}-C${idx + 1}`
        });
      });

      // Prepare Google Sheets Payload with Legal Audit Trail
      const payload = {
        action: "register",
        parentName: primaryAttendee.name,
        whatsappNumber: sheetSafePrimaryPhone,
        parentEmail: primaryAttendee.email,
        primaryGender: primaryAttendee.gender,
        regId: groupRegId,
        adults: additionalAdults.map(a => ({
          name: a.name,
          gender: a.gender,
          phone: a.phone ? (a.phone.startsWith("'") ? a.phone : `'${a.phone}`) : '',
          email: a.email || ''
        })),
        children: children,
        totalSeats: allAttendees.length,
        termsVersion: "v1.0 (2026-11-26)",
        termsConsentAccepted: true,
        termsConsentTimestamp: new Date().toISOString(),
        marketingConsent: !!document.getElementById('marketingConsent')?.checked,
        photoConsent: !!document.getElementById('photoConsent')?.checked,
        eventName: "Pujya Dr. Gyanvatsal Swami Bangkok Discourse 2026",
        timestamp: new Date().toISOString()
      };

      // Dispatch to Google Apps Script
      submitToGoogleSheets(payload);

      // Render Confirmation Pass UI
      setTimeout(() => {
        const formHeadingGroup = document.querySelector('.form-heading-group');
        if (formHeadingGroup) formHeadingGroup.style.display = 'none';

        document.getElementById('confirmedName').textContent = primaryAttendee.name;
        document.getElementById('confirmedPassId').textContent = groupRegId;
        const confirmedPhoneEl = document.getElementById('confirmedPhone');
        if (confirmedPhoneEl) confirmedPhoneEl.textContent = primaryAttendee.phone;
        document.getElementById('confirmedSeats').textContent = `${allAttendees.length} ${allAttendees.length === 1 ? 'Seat' : 'Seats'} Reserved`;

        const manifestCount = document.getElementById('manifestCountLabel');
        if (manifestCount) {
          manifestCount.textContent = `${allAttendees.length} ${allAttendees.length === 1 ? 'Guest Admitted' : 'Guests Admitted'}`;
        }

        const emailNotice = document.getElementById('confirmedEmailNotice');
        if (emailNotice) {
          emailNotice.textContent = primaryAttendee.email || 'your email';
        }

        if (attendeeBadgesContainer) {
          attendeeBadgesContainer.innerHTML = '';
          allAttendees.forEach((att, idx) => {
            const row = document.createElement('div');
            row.className = 'badge-attendee-item';
            const seatLabel = `Pass ${idx + 1} of ${allAttendees.length}`;
            const genderLabel = att.gender === 'Female' ? 'Female' : 'Male';
            const categoryText = `${att.role} • ${genderLabel}`;
            row.innerHTML = `
              <div class="badge-info-block">
                <span class="badge-seat-label">${seatLabel}</span>
                <span class="badge-name-text">${att.name}</span>
                <span class="badge-category-subtext">${categoryText}</span>
              </div>
              <span class="badge-id-code">${att.badgeId}</span>
            `;
            attendeeBadgesContainer.appendChild(row);
          });
        }

        form.style.display = 'none';
        regSuccess.style.display = 'flex';

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `
            <span class="btn-text">Confirm Registration</span>
            <svg class="btn-arrow-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          `;
        }
      }, 700);
    });
  }

  if (newRegBtn) {
    newRegBtn.addEventListener('click', () => {
      form.reset();
      additionalAdultsList.innerHTML = '';
      childrenList.innerHTML = '';
      adultCount = 0;
      childCount = 0;
      const formHeadingGroup = document.querySelector('.form-heading-group');
      if (formHeadingGroup) formHeadingGroup.style.display = 'block';
      regSuccess.style.display = 'none';
      form.style.display = 'flex';
      const nameInput = document.getElementById('fullName');
      if (nameInput) nameInput.focus();
    });
  }

  // Terms Consent Change Handler
  const termsConsentInput = document.getElementById('termsConsent');
  const termsConsentErrorBox = document.getElementById('termsConsentError');
  if (termsConsentInput && termsConsentErrorBox) {
    termsConsentInput.addEventListener('change', () => {
      if (termsConsentInput.checked) {
        termsConsentErrorBox.style.display = 'none';
      }
    });
  }

  // Legal / Terms Modal Handlers (Kids Diwali Architecture)
  const legalModal = document.getElementById('legalModal');
  const openTermsLink = document.getElementById('openTermsLink');
  const openPrivacyLink = document.getElementById('openPrivacyLink');
  const closeLegalModalBtn = document.getElementById('closeLegalModalBtn');

  function openLegalModal(sectionId) {
    if (!legalModal) return;
    legalModal.classList.add('active');
    if (sectionId) {
      setTimeout(() => {
        const sec = document.getElementById(sectionId);
        if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }

  function closeLegalModal() {
    if (legalModal) legalModal.classList.remove('active');
  }

  if (openTermsLink) {
    openTermsLink.addEventListener('click', (e) => {
      e.preventDefault();
      openLegalModal('sec-terms');
    });
  }

  if (openPrivacyLink) {
    openPrivacyLink.addEventListener('click', (e) => {
      e.preventDefault();
      openLegalModal('sec-privacy');
    });
  }

  if (closeLegalModalBtn) {
    closeLegalModalBtn.addEventListener('click', closeLegalModal);
  }

  if (legalModal) {
    legalModal.addEventListener('click', (e) => {
      if (e.target === legalModal) closeLegalModal();
    });
  }


  // =========================================================================
  // 8. Glassmorphic AI Event Assistant (Zero External APIs, 100% Free & Local)
  // Pops up only when user is stationary (no interaction) for 10 seconds!
  // =========================================================================
  const aiChatToggle = document.getElementById('aiChatToggle');
  const aiChatPanel = document.getElementById('aiChatPanel');
  const aiChatClose = document.getElementById('aiChatClose');
  const aiSpeechBubble = document.getElementById('aiSpeechBubble');
  const bubbleCloseBtn = document.getElementById('bubbleCloseBtn');
  const aiChatBody = document.getElementById('aiChatBody');
  const aiChatForm = document.getElementById('aiChatForm');
  const aiUserInput = document.getElementById('aiUserInput');
  const aiQuickChips = document.getElementById('aiQuickChips');

  let hasGreeted = false;
  let aiIdleTimer = null;
  let speechBubbleDismissed = false;

  function resetAiIdleTimer() {
    if (aiIdleTimer) {
      clearTimeout(aiIdleTimer);
      aiIdleTimer = null;
    }

    if (speechBubbleDismissed || (aiChatPanel && aiChatPanel.classList.contains('is-open'))) {
      return;
    }

    // Only pops up when user has been completely stationary for 10 seconds
    aiIdleTimer = setTimeout(() => {
      if (aiSpeechBubble && (!aiChatPanel || !aiChatPanel.classList.contains('is-open')) && !speechBubbleDismissed) {
        aiSpeechBubble.classList.add('is-visible');
      }
    }, 10000);
  }

  // Listen to all interaction events across window
  ['mousemove', 'mousedown', 'scroll', 'touchstart', 'touchmove', 'keydown'].forEach(evt => {
    window.addEventListener(evt, resetAiIdleTimer, { passive: true });
  });
  resetAiIdleTimer();

  if (bubbleCloseBtn) {
    bubbleCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      speechBubbleDismissed = true;
      if (aiSpeechBubble) aiSpeechBubble.classList.remove('is-visible');
    });
  }

  if (aiSpeechBubble) {
    aiSpeechBubble.addEventListener('click', () => {
      toggleAiChat(true);
    });
  }

  function toggleAiChat(open = null) {
    if (!aiChatPanel) return;
    const shouldOpen = open !== null ? open : !aiChatPanel.classList.contains('is-open');
    if (shouldOpen) {
      aiChatPanel.classList.add('is-open');
      aiChatPanel.setAttribute('aria-hidden', 'false');
      if (aiSpeechBubble) aiSpeechBubble.classList.remove('is-visible');
      if (!hasGreeted) {
        initAiGreeting();
        hasGreeted = true;
      }
      setTimeout(() => {
        if (aiUserInput) aiUserInput.focus();
      }, 300);
    } else {
      aiChatPanel.classList.remove('is-open');
      aiChatPanel.setAttribute('aria-hidden', 'true');
    }
  }

  if (aiChatToggle) {
    aiChatToggle.addEventListener('click', () => toggleAiChat());
  }

  if (aiChatClose) {
    aiChatClose.addEventListener('click', () => toggleAiChat(false));
  }

  function addChatMessage(content, sender = 'bot', customHtml = null) {
    if (!aiChatBody) return;
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;

    if (customHtml) {
      bubble.innerHTML = customHtml;
    } else {
      bubble.textContent = content;
    }

    aiChatBody.appendChild(bubble);
    aiChatBody.scrollTop = aiChatBody.scrollHeight;
  }

  function initAiGreeting() {
    addChatMessage('', 'bot', `
      <div>
        <p><strong>Jai Swaminarayan!</strong> How can I help you?</p>
      </div>
    `);
  }

  function handleAiQuery(queryText) {
    if (!queryText || !queryText.trim()) return;
    const userText = queryText.trim();
    addChatMessage(userText, 'user');
    if (aiUserInput) aiUserInput.value = '';

    const lower = userText.toLowerCase();

    setTimeout(() => {
      respondToUser(lower);
    }, 400);
  }

  function respondToUser(query) {
    // 1. Registration help
    if (query.includes('regis') || query.includes('sign up') || query.includes('book') || query.includes('seat') || query.includes('pass') || query.includes('attend')) {
      addChatMessage('', 'bot', `
        <div>
          <p>Pre-registration is required to guarantee entry.</p>
          <p style="margin-top:6px;">You can register right here in 30 seconds:</p>
          <button type="button" class="chat-action-btn" id="aiJumpToFormBtn">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            <span>Fill Registration Form</span>
          </button>
        </div>
      `);
      const jumpBtn = document.getElementById('aiJumpToFormBtn');
      if (jumpBtn) {
        jumpBtn.addEventListener('click', () => {
          toggleAiChat(false);
          scrollToTarget('#stack-section', 1.2, () => {
            flipToCard(1);
          });
        });
      }
      return;
    }

    // 2. Discourse Topic & Speaker
    if (query.includes('topic') || query.includes('speaker') || query.includes('swami') || query.includes('gnanvatsal') || query.includes('gyanvatsal') || query.includes('about') || query.includes('burnout')) {
      addChatMessage('', 'bot', `
        <div>
          <p><strong>Discourse Topic:</strong> <em>"From Burnout to Balance"</em></p>
          <p style="margin-top:6px;"><strong>Speaker:</strong> Pujya Dr. Gyanvatsal Swami is an internationally acclaimed motivational speaker from BAPS Swaminarayan Sanstha and a BVM mechanical engineering graduate, renowned for practical wisdom on stress management and holistic leadership.</p>
        </div>
      `);
      return;
    }

    // 3. Date & Time
    if (query.includes('time') || query.includes('date') || query.includes('when') || query.includes('schedule') || query.includes('hour')) {
      addChatMessage('', 'bot', `
        <div>
          <p><strong>Date:</strong> Sunday, 13 December 2026</p>
          <p style="margin-top:4px;"><strong>Time:</strong> 5:30 PM ICT</p>
          <p style="margin-top:4px; opacity:0.85;">Doors open at 5:00 PM for seating. Sanctified dinner (Mahaprasad) will follow the discourse.</p>
        </div>
      `);
      return;
    }

    // 4. Venue, Map & Parking
    if (query.includes('venue') || query.includes('where') || query.includes('location') || query.includes('map') || query.includes('address') || query.includes('park') || query.includes('tio chew')) {
      addChatMessage('', 'bot', `
        <div>
          <p><strong>Venue:</strong> The Tio Chew Association of Thailand</p>
          <p style="font-size:12px; opacity:0.85; margin-top:2px;">No. 1, Chan Road, Soi Yenchit 12, Thung Wat Don, Sathorn, Bangkok 10120</p>
          <p style="margin-top:6px; color:#ffffff; font-size:12px;">Visitor parking is available on-site for registered attendees.</p>
          <a href="https://maps.google.com/?q=13.71273,100.52468" target="_blank" rel="noopener noreferrer" class="chat-action-btn">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span>Open Google Maps</span>
          </a>
        </div>
      `);
      return;
    }

    // 5. Cost / Tickets
    if (query.includes('cost') || query.includes('price') || query.includes('ticket') || query.includes('free') || query.includes('fee')) {
      addChatMessage('', 'bot', `
        <div>
          <p>There are no ticket charges. Everyone is welcome to attend with family and friends. Simply reserve your seat online to receive your entry pass.</p>
        </div>
      `);
      return;
    }

    // 6. Language & Dress code
    if (query.includes('language') || query.includes('english') || query.includes('hindi') || query.includes('gujarati') || query.includes('dress') || query.includes('clothes')) {
      addChatMessage('', 'bot', `
        <div>
          <p><strong>Language:</strong> The discourse will be delivered in English with Hindi/Gujarati blend accessible to all.</p>
          <p style="margin-top:4px;"><strong>Dress Code:</strong> Smart casual or modest traditional attire.</p>
        </div>
      `);
      return;
    }

    // 7. Fallback / Support Routing (Pure SVGs)
    addChatMessage('', 'bot', `
      <div>
        <p>I can help with event details and seat reservations. For private inquiries, special requests, or personalized support, please contact our Bangkok volunteer organizing team directly:</p>
        <div class="chat-support-card">
          <div style="font-weight:700; color:#ffffff;">BAPS Bangkok Support</div>
          <a href="https://wa.me/66812345678?text=Hello%20BAPS%20Bangkok%20Team%2C%20I%20have%20an%20inquiry%20regarding%20Pujya%20Gyanvatsal%20Swami%20Discourse." target="_blank" rel="noopener noreferrer" class="support-link-item">
            <span>WhatsApp Support</span>
            <span>+66 81 234 5678</span>
          </a>
          <a href="mailto:baps.bangkok@gmail.com?subject=Inquiry%20-%20Gyanvatsal%20Swami%20Bangkok%20Discourse" class="support-link-item">
            <span>Email</span>
            <span>baps.bangkok@gmail.com</span>
          </a>
          <a href="tel:+6621234567" class="support-link-item">
            <span>Phone</span>
            <span>+66 2 123 4567</span>
          </a>
        </div>
      </div>
    `);
  }

  if (aiChatForm) {
    aiChatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (aiUserInput) {
        handleAiQuery(aiUserInput.value);
      }
    });
  }

  if (aiQuickChips) {
    aiQuickChips.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip-btn');
      if (!btn) return;
      const queryType = btn.dataset.query;
      let text = '';
      if (queryType === 'register') text = 'How can I register for the event?';
      else if (queryType === 'topic') text = 'What is the topic and who is the speaker?';
      else if (queryType === 'venue') text = 'Where is the venue and is there parking?';
      else if (queryType === 'time') text = 'What date and time does it start?';
      else if (queryType === 'support') text = 'I need support contact details.';
      handleAiQuery(text);
    });
  }
});
