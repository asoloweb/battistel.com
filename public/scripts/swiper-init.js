document.addEventListener('DOMContentLoaded', () => {
  if (!window.Swiper) return;
  const sliders = document.querySelectorAll('.slider_block.swiper, .news_block.swiper');
  sliders.forEach((el) => {
    if (el.getAttribute('data-swiper-initialized') === 'true') return;
    const slides = el.querySelectorAll('.swiper-slide');
    const hasMultipleSlides = slides.length > 1;
    const nextEl = el.querySelector('.swiper-button-next');
    const prevEl = el.querySelector('.swiper-button-prev');
    const paginationEl = el.querySelector('.swiper-pagination');

    const options = {
      loop: hasMultipleSlides,
      speed: 500,
      slidesPerView: 1,
      spaceBetween: 20,
      watchOverflow: false,
    };
    const isNewsSlider = el.classList.contains('news_block');

    if (isNewsSlider) {
      options.slidesPerView = 3;
      options.spaceBetween = 24;
      options.breakpoints = {
        0: { slidesPerView: 1 },
        700: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
      };
    }

    if (paginationEl) {
      options.pagination = { el: paginationEl, clickable: true };
    }
    if (nextEl && prevEl) {
      options.navigation = { nextEl, prevEl };
    }
    if (el.getAttribute('data-swiper-autoplay') === 'true') {
      const autoplayDelay = Number(el.getAttribute('data-swiper-autoplay-delay')) || 4500;
      options.autoplay = { delay: autoplayDelay, disableOnInteraction: false };
    }

    try {
      new window.Swiper(el, options);
    } catch (error) {
      console.error('Errore inizializzando swiper', error);
      return;
    }

    el.setAttribute('data-swiper-initialized', 'true');
    el.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const href = target.getAttribute('data-href');
      if (href) {
        window.location.href = href;
      }
    });
  });
});
