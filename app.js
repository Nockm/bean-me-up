const deck = document.querySelector('#deck');
const navigation = document.querySelector('#navigation');
const dots = document.querySelector('#dots');
const counter = document.querySelector('#counter');
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const picker = document.querySelector('.coffee-picker');
let coffees = [];
let selected = 0;
let cards = [];
let controls = [];
function choose(index) {
  if (!coffees.length) return;
  selected = (index + coffees.length) % coffees.length;
  cards.forEach((card, index) => {
    const offset = (index - selected + coffees.length) % coffees.length;
    card.dataset.position = offset === 0 ? 'active' : offset === 1 ? 'next' : offset === coffees.length - 1 ? 'previous' : 'hidden';
    card.setAttribute('aria-hidden', String(index !== selected));
    controls[index].setAttribute('aria-current', String(index === selected));
    card.querySelector('.image-open').tabIndex = index === selected ? 0 : -1;
  });
  counter.textContent = `${String(selected + 1).padStart(2, '0')} / ${String(coffees.length).padStart(2, '0')}`;
}
previous.addEventListener('click', () => choose(selected - 1));
next.addEventListener('click', () => choose(selected + 1));
picker.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault(); choose(selected + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
let lastSwipe = -Infinity;
let touchStart;
deck.addEventListener('touchstart', event => { const touch = event.touches[0]; touchStart = { x: touch.clientX, y: touch.clientY }; }, { passive: true });
deck.addEventListener('touchend', event => {
  if (!touchStart) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.x, dy = touch.clientY - touchStart.y;
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
    choose(selected + (dx < 0 ? 1 : -1)); lastSwipe = performance.now();
  }
  touchStart = null;
}, { passive: true });
deck.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
async function load() {
  try {
    const response = await fetch('coffees.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Catalog unavailable');
    coffees = await response.json();
    deck.replaceChildren();
    if (!coffees.length) {
      const message = document.createElement('p'); message.className = 'message';
      message.textContent = 'The coffee cards are taking a little break. Check back soon.';
      deck.append(message); return;
    }
    cards = coffees.map((coffee, index) => {
      const card = document.createElement('article'); card.className = 'card';
      const top = document.createElement('div'); top.className = 'card-top';
      const number = document.createElement('span'); number.textContent = String(index + 1).padStart(2, '0');
      const star = document.createElement('span'); star.textContent = '✳'; star.setAttribute('aria-hidden', 'true');
      top.append(number, star);
      const image = document.createElement('img'); image.className = 'card-image'; image.src = coffee.images[0]; image.alt = ''; image.draggable = false;
      const imageOpen = document.createElement('button'); imageOpen.className = 'image-open';
      imageOpen.setAttribute('aria-label', `View photos of ${coffee.title}`);
      imageOpen.append(image);
      if (coffee.images.length > 1) {
        const badge = document.createElement('span'); badge.className = 'photo-badge'; badge.textContent = `${coffee.images.length} photos`;
        imageOpen.append(badge);
      }
      imageOpen.addEventListener('click', event => {
        event.stopPropagation();
        if (performance.now() - lastSwipe < 350) return;
        if (index !== selected) choose(index); else openGallery(index);
      });
      const title = document.createElement('h2'); title.textContent = coffee.title;
      const bottom = document.createElement('p'); bottom.className = 'card-bottom'; bottom.textContent = 'ON THE COFFEE TABLE';
      card.append(top, imageOpen, title, bottom);
      card.addEventListener('click', () => { if (card.dataset.position !== 'active') choose(index); });
      deck.append(card); return card;
    });
    controls = coffees.map((coffee, index) => {
      const button = document.createElement('button'); button.className = 'dot'; button.setAttribute('aria-label', `Show ${coffee.title}`);
      button.addEventListener('click', () => choose(index)); dots.append(button); return button;
    });
    navigation.hidden = false;
    previous.disabled = next.disabled = coffees.length < 2;
    document.querySelector('#hint').hidden = coffees.length < 2;
    choose(0);
  } catch {
    deck.replaceChildren();
    const message = document.createElement('p'); message.className = 'message';
    message.textContent = 'Couldn’t load the coffees. Please try refreshing the page.'; deck.append(message);
  }
}
const gallery = document.querySelector('#gallery');
const galleryImage = document.querySelector('#gallery-image');
const thumbnails = document.querySelector('#thumbnails');
const imagePrevious = document.querySelector('#image-previous');
const imageNext = document.querySelector('#image-next');
let galleryCoffee = 0;
let photo = 0;
let thumbnailButtons = [];
function showPhoto(index) {
  const coffee = coffees[galleryCoffee];
  photo = (index + coffee.images.length) % coffee.images.length;
  document.querySelector('#image-error').hidden = true;
  galleryImage.src = coffee.images[photo];
  galleryImage.alt = `${coffee.title}, photo ${photo + 1} of ${coffee.images.length}`;
  document.querySelector('#image-counter').textContent = `${photo + 1} / ${coffee.images.length}`;
  thumbnailButtons.forEach((button, index) => button.setAttribute('aria-current', String(index === photo)));
}
function openGallery(index) {
  galleryCoffee = index;
  const coffee = coffees[index];
  document.querySelector('#gallery-title').textContent = coffee.title;
  thumbnails.replaceChildren();
  thumbnailButtons = coffee.images.map((source, imageIndex) => {
    const button = document.createElement('button'); button.className = 'thumbnail';
    button.setAttribute('aria-label', `Show photo ${imageIndex + 1}`);
    const image = document.createElement('img'); image.src = source; image.alt = ''; image.loading = 'lazy';
    button.append(image); button.addEventListener('click', () => showPhoto(imageIndex));
    thumbnails.append(button); return button;
  });
  const multiple = coffee.images.length > 1;
  imagePrevious.disabled = imageNext.disabled = !multiple;
  thumbnails.hidden = !multiple;
  document.querySelector('.gallery-hint').hidden = !multiple;
  showPhoto(0);
  gallery.showModal();
  document.body.classList.add('gallery-open');
}
galleryImage.addEventListener('error', () => { document.querySelector('#image-error').hidden = false; });
document.querySelector('#gallery-close').addEventListener('click', () => gallery.close());
gallery.addEventListener('close', () => { document.body.classList.remove('gallery-open'); });
gallery.addEventListener('click', event => {
  const bounds = gallery.getBoundingClientRect();
  if (event.target === gallery && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) gallery.close();
});
imagePrevious.addEventListener('click', () => showPhoto(photo - 1));
imageNext.addEventListener('click', () => showPhoto(photo + 1));
gallery.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault(); showPhoto(photo + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
let galleryTouch;
const stage = document.querySelector('.gallery-stage');
stage.addEventListener('touchstart', event => {
  galleryTouch = { x: event.touches[0].clientX, y: event.touches[0].clientY };
}, { passive: true });
stage.addEventListener('touchend', event => {
  if (!galleryTouch) return;
  const dx = event.changedTouches[0].clientX - galleryTouch.x;
  const dy = event.changedTouches[0].clientY - galleryTouch.y;
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) showPhoto(photo + (dx < 0 ? 1 : -1));
  galleryTouch = null;
}, { passive: true });
stage.addEventListener('touchcancel', () => { galleryTouch = null; }, { passive: true });
load();
