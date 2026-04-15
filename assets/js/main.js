document.documentElement.classList.add('js-ready');

const coverflows = document.querySelectorAll('[data-coverflow]');

coverflows.forEach((carousel) => {
  const track = carousel.querySelector('[data-carousel-track]');
  const viewport = carousel.querySelector('[data-carousel-viewport]');
  const prevBtn = carousel.querySelector('[data-carousel-prev]');
  const nextBtn = carousel.querySelector('[data-carousel-next]');
  const dotsWrap = carousel.querySelector('[data-carousel-dots]');
  const baseSlides = Array.from(carousel.querySelectorAll('[data-carousel-slide]'));
  const autoplayDelay = Number(carousel.dataset.autoplay || 4200);

  if (!track || !viewport || baseSlides.length < 2) return;

  const firstClone = baseSlides[0].cloneNode(true);
  const lastClone = baseSlides[baseSlides.length - 1].cloneNode(true);
  firstClone.classList.add('is-clone');
  lastClone.classList.add('is-clone');
  firstClone.setAttribute('aria-hidden', 'true');
  lastClone.setAttribute('aria-hidden', 'true');
  track.insertBefore(lastClone, baseSlides[0]);
  track.appendChild(firstClone);

  const slides = Array.from(track.children);
  let currentIndex = 1;
  let slideWidth = 0;
  let gap = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let autoplayId = null;
  let isDragging = false;
  let startX = 0;
  let animationFrame = null;

  const dots = baseSlides.map((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Aller à la slide ${index + 1}`);
    dot.addEventListener('click', () => {
      goTo(index + 1);
      restartAutoplay();
    });
    dotsWrap.appendChild(dot);
    return dot;
  });

  const getGap = () => {
    const styles = window.getComputedStyle(track);
    return parseFloat(styles.gap || styles.columnGap || 0);
  };

  const setTransition = (enabled) => {
    track.style.transition = enabled ? 'transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
  };

  const visibleOffset = () => {
    const viewportWidth = viewport.getBoundingClientRect().width;
    return (viewportWidth - slideWidth) / 2;
  };

  const getTranslateForIndex = (index) => visibleOffset() - index * (slideWidth + gap);

  const realIndexFromCurrent = () => ((currentIndex - 1) % baseSlides.length + baseSlides.length) % baseSlides.length;

  const updateDots = () => {
    const active = realIndexFromCurrent();
    dots.forEach((dot, index) => {
      const isActive = index === active;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  };

  const applyDepthState = () => {
    slides.forEach((slide, index) => {
      const offset = index - currentIndex;
      slide.classList.remove('is-active', 'is-prev', 'is-next', 'is-hidden-edge');

      if (offset === 0) slide.classList.add('is-active');
      if (offset === -1) slide.classList.add('is-prev');
      if (offset === 1) slide.classList.add('is-next');
      if (Math.abs(offset) > 1) slide.classList.add('is-hidden-edge');
    });
  };

  const setTranslate = (value, withTransition = true) => {
    setTransition(withTransition);
    track.style.transform = `translate3d(${value}px, 0, 0)`;
    currentTranslate = value;
  };

  const jumpTo = (index) => {
    currentIndex = index;
    const nextTranslate = getTranslateForIndex(index);
    setTranslate(nextTranslate, false);
    prevTranslate = nextTranslate;
    applyDepthState();
    updateDots();
  };

  const goTo = (index) => {
    currentIndex = index;
    const nextTranslate = getTranslateForIndex(index);
    setTranslate(nextTranslate, true);
    prevTranslate = nextTranslate;
    applyDepthState();
    updateDots();
  };

  const normalizeLoop = () => {
    if (currentIndex === 0) {
      jumpTo(baseSlides.length);
    } else if (currentIndex === slides.length - 1) {
      jumpTo(1);
    }
  };

  const next = () => goTo(currentIndex + 1);
  const prev = () => goTo(currentIndex - 1);

  const stopAutoplay = () => {
    if (autoplayId) {
      clearInterval(autoplayId);
      autoplayId = null;
    }
  };

  const startAutoplay = () => {
    stopAutoplay();
    autoplayId = setInterval(next, autoplayDelay);
  };

  const restartAutoplay = () => {
    stopAutoplay();
    startAutoplay();
  };

  const updateMeasurements = () => {
    slideWidth = slides[0].getBoundingClientRect().width;
    gap = getGap();
    jumpTo(currentIndex);
  };

  const animateDrag = () => {
    setTranslate(currentTranslate, false);
    if (isDragging) animationFrame = requestAnimationFrame(animateDrag);
  };

  const dragStart = (clientX) => {
    isDragging = true;
    startX = clientX;
    stopAutoplay();
    track.style.cursor = 'grabbing';
    animationFrame = requestAnimationFrame(animateDrag);
  };

  const dragMove = (clientX) => {
    if (!isDragging) return;
    const moved = clientX - startX;
    currentTranslate = prevTranslate + moved;
  };

  const dragEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    cancelAnimationFrame(animationFrame);
    const movedBy = currentTranslate - prevTranslate;
    track.style.cursor = 'grab';

    if (movedBy < -70) {
      next();
    } else if (movedBy > 70) {
      prev();
    } else {
      goTo(currentIndex);
    }

    startAutoplay();
  };

  prevBtn?.addEventListener('click', () => {
    prev();
    restartAutoplay();
  });

  nextBtn?.addEventListener('click', () => {
    next();
    restartAutoplay();
  });

  viewport.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      prev();
      restartAutoplay();
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      next();
      restartAutoplay();
    }
  });

  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);
  carousel.addEventListener('focusin', stopAutoplay);
  carousel.addEventListener('focusout', startAutoplay);

  track.addEventListener('transitionend', normalizeLoop);
  track.addEventListener('mousedown', (event) => dragStart(event.clientX));
  window.addEventListener('mousemove', (event) => dragMove(event.clientX));
  window.addEventListener('mouseup', dragEnd);
  window.addEventListener('mouseleave', dragEnd);

  track.addEventListener('touchstart', (event) => dragStart(event.touches[0].clientX), { passive: true });
  track.addEventListener('touchmove', (event) => dragMove(event.touches[0].clientX), { passive: true });
  track.addEventListener('touchend', dragEnd);

  window.addEventListener('resize', updateMeasurements);

  track.style.cursor = 'grab';
  updateMeasurements();
  startAutoplay();
});