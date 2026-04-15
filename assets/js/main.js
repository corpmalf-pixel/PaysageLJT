document.documentElement.classList.add('js-ready');

const carousels = document.querySelectorAll('[data-carousel]');

carousels.forEach((carousel) => {
  const track = carousel.querySelector('[data-carousel-track]');
  const slides = Array.from(carousel.querySelectorAll('[data-carousel-slide]'));
  const viewport = carousel.querySelector('[data-carousel-viewport]');
  const dotsWrap = carousel.querySelector('[data-carousel-dots]');
  const prevBtn = carousel.querySelector('[data-carousel-prev]');
  const nextBtn = carousel.querySelector('[data-carousel-next]');
  const autoplayDelay = Number(carousel.dataset.autoplay || 4800);

  if (!track || !slides.length) return;

  const firstClone = slides[0].cloneNode(true);
  const lastClone = slides[slides.length - 1].cloneNode(true);
  firstClone.setAttribute('aria-hidden', 'true');
  lastClone.setAttribute('aria-hidden', 'true');
  firstClone.classList.add('is-clone');
  lastClone.classList.add('is-clone');
  track.insertBefore(lastClone, slides[0]);
  track.appendChild(firstClone);

  const allSlides = Array.from(track.children);
  let currentIndex = 1;
  let autoplayId = null;
  let slideWidth = 0;
  let isDragging = false;
  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let animationFrame = 0;

  const dots = slides.map((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Aller à la slide ${index + 1}`);
    dot.addEventListener('click', () => goTo(index + 1));
    dotsWrap.appendChild(dot);
    return dot;
  });

  function getGap() {
    const styles = window.getComputedStyle(track);
    return parseFloat(styles.columnGap || styles.gap || 0);
  }

  function updateMeasurements() {
    slideWidth = allSlides[0].getBoundingClientRect().width + getGap();
    jumpTo(currentIndex);
  }

  function setActiveDot() {
    const realIndex = ((currentIndex - 1) % slides.length + slides.length) % slides.length;
    dots.forEach((dot, index) => {
      dot.classList.toggle('is-active', index === realIndex);
      dot.setAttribute('aria-current', index === realIndex ? 'true' : 'false');
    });
  }

  function setTranslate(value, withTransition = true) {
    track.style.transition = withTransition ? 'transform 0.72s cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
    track.style.transform = `translate3d(${value}px, 0, 0)`;
    currentTranslate = value;
  }

  function jumpTo(index) {
    const nextTranslate = -(index * slideWidth);
    setTranslate(nextTranslate, false);
    prevTranslate = nextTranslate;
    currentIndex = index;
    setActiveDot();
  }

  function goTo(index) {
    currentIndex = index;
    const nextTranslate = -(index * slideWidth);
    setTranslate(nextTranslate, true);
    prevTranslate = nextTranslate;
    setActiveDot();
  }

  function normalizeIndex() {
    if (currentIndex === 0) {
      jumpTo(slides.length);
    } else if (currentIndex === allSlides.length - 1) {
      jumpTo(1);
    }
  }

  function next() {
    goTo(currentIndex + 1);
  }

  function prev() {
    goTo(currentIndex - 1);
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayId = window.setInterval(next, autoplayDelay);
  }

  function stopAutoplay() {
    if (autoplayId) {
      window.clearInterval(autoplayId);
      autoplayId = null;
    }
  }

  function animation() {
    setTranslate(currentTranslate, false);
    if (isDragging) animationFrame = requestAnimationFrame(animation);
  }

  function pointerDown(clientX) {
    isDragging = true;
    startX = clientX;
    stopAutoplay();
    track.style.cursor = 'grabbing';
    animationFrame = requestAnimationFrame(animation);
  }

  function pointerMove(clientX) {
    if (!isDragging) return;
    const delta = clientX - startX;
    currentTranslate = prevTranslate + delta;
  }

  function pointerUp() {
    if (!isDragging) return;
    isDragging = false;
    cancelAnimationFrame(animationFrame);
    const movedBy = currentTranslate - prevTranslate;
    track.style.cursor = 'grab';

    if (movedBy < -60) {
      next();
    } else if (movedBy > 60) {
      prev();
    } else {
      goTo(currentIndex);
    }

    startAutoplay();
  }

  prevBtn?.addEventListener('click', () => {
    prev();
    startAutoplay();
  });

  nextBtn?.addEventListener('click', () => {
    next();
    startAutoplay();
  });

  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);
  carousel.addEventListener('focusin', stopAutoplay);
  carousel.addEventListener('focusout', startAutoplay);

  viewport.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      next();
      startAutoplay();
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      prev();
      startAutoplay();
    }
  });

  track.addEventListener('transitionend', normalizeIndex);

  track.addEventListener('mousedown', (event) => pointerDown(event.clientX));
  window.addEventListener('mousemove', (event) => pointerMove(event.clientX));
  window.addEventListener('mouseup', pointerUp);
  window.addEventListener('mouseleave', pointerUp);

  track.addEventListener('touchstart', (event) => pointerDown(event.touches[0].clientX), { passive: true });
  track.addEventListener('touchmove', (event) => pointerMove(event.touches[0].clientX), { passive: true });
  track.addEventListener('touchend', pointerUp);

  window.addEventListener('resize', updateMeasurements);

  track.style.cursor = 'grab';
  updateMeasurements();
  startAutoplay();
});