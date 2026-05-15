/* ============================================================
   SAKURA OMAKASE — Main JavaScript
   ============================================================ */

const navbar = document.getElementById('navbar');
if (navbar) {
  const onScroll = () => { navbar.classList.toggle('scrolled', window.scrollY > 40); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

const navLinks = document.querySelectorAll('.nav-links a');
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
navLinks.forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) link.classList.add('active');
});

const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

const heroBg = document.querySelector('.hero-bg');
if (heroBg) {
  const img = new Image();
  img.onload = () => heroBg.classList.add('loaded');
  img.src = heroBg.style.backgroundImage?.match(/url\(['"]?(.+?)['"]?\)/)?.[1] || '';
}

const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(el => { if (el.isIntersecting) { el.target.classList.add('visible'); observer.unobserve(el.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach(el => observer.observe(el));
}

const tabBtns = document.querySelectorAll('.tab-btn');
if (tabBtns.length) {
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (target === 'all') {
        document.querySelectorAll('.menu-section').forEach(s => s.style.display = '');
      } else {
        document.querySelectorAll('.menu-section').forEach(s => {
          s.style.display = s.dataset.category === target ? '' : 'none';
        });
      }
      const first = document.querySelector(target === 'all' ? '.menu-section' : `.menu-section[data-category="${target}"]`);
      if (first) {
        const offset = document.querySelector('.menu-tabs')?.offsetHeight || 0;
        const y = first.getBoundingClientRect().top + window.scrollY - (80 + offset + 16);
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });
}

(function initCalendar() {
  const calGrid = document.getElementById('cal-grid');
  const calMonth = document.getElementById('cal-month');
  const calPrev = document.getElementById('cal-prev');
  const calNext = document.getElementById('cal-next');
  const selectedDateEl = document.getElementById('selected-date');
  if (!calGrid) return;
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const today = new Date();
  let current = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedDate = null;
  function render() {
    calMonth.textContent = `${MONTHS[current.getMonth()]} ${current.getFullYear()}`;
    calGrid.querySelectorAll('.cal-day').forEach(d => d.remove());
    const firstDay = new Date(current.getFullYear(), current.getMonth(), 1).getDay();
    const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) { const div = document.createElement('div'); div.className = 'cal-day empty'; calGrid.appendChild(div); }
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(current.getFullYear(), current.getMonth(), d);
      const div = document.createElement('div');
      div.className = 'cal-day';
      div.textContent = d;
      const isPast = dayDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isToday = dayDate.toDateString() === today.toDateString();
      if (isPast) div.classList.add('past');
      if (isToday) div.classList.add('today');
      if (selectedDate && dayDate.toDateString() === selectedDate.toDateString()) div.classList.add('selected');
      if (!isPast) {
        div.addEventListener('click', () => {
          selectedDate = dayDate;
          if (selectedDateEl) selectedDateEl.textContent = dayDate.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' });
          render();
          updateConfirmSummary();
        });
      }
      calGrid.appendChild(div);
    }
  }
  calPrev?.addEventListener('click', () => {
    const prev = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    if (prev >= new Date(today.getFullYear(), today.getMonth(), 1)) { current = prev; render(); }
  });
  calNext?.addEventListener('click', () => { current = new Date(current.getFullYear(), current.getMonth() + 1, 1); render(); });
  render();
})();

document.querySelectorAll('.time-slot:not(.unavailable)').forEach(slot => {
  slot.addEventListener('click', () => {
    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
    slot.classList.add('selected');
    const timeEl = document.getElementById('selected-time');
    if (timeEl) timeEl.textContent = slot.textContent;
    updateConfirmSummary();
  });
});

const bookingSteps = document.querySelectorAll('.booking-step');
const stepIndicators = document.querySelectorAll('.step-indicator');
let currentStep = 0;
function showStep(idx) {
  bookingSteps.forEach((s, i) => s.style.display = i === idx ? '' : 'none');
  stepIndicators.forEach((ind, i) => { ind.classList.toggle('active', i === idx); ind.classList.toggle('done', i < idx); });
  currentStep = idx;
}
if (bookingSteps.length) showStep(0);
document.querySelectorAll('[data-next-step]').forEach(btn => { btn.addEventListener('click', () => { const next = parseInt(btn.dataset.nextStep); if (validateStep(currentStep)) showStep(next); }); });
document.querySelectorAll('[data-prev-step]').forEach(btn => { btn.addEventListener('click', () => showStep(parseInt(btn.dataset.prevStep))); });

function validateStep(idx) {
  if (idx === 0) {
    const date = document.getElementById('selected-date')?.textContent;
    const time = document.getElementById('selected-time')?.textContent;
    if (!date || date === '—') { showToast('Please select a date'); return false; }
    if (!time || time === '—') { showToast('Please select a time slot'); return false; }
  }
  if (idx === 1) {
    const name = document.getElementById('guest-name')?.value.trim();
    const email = document.getElementById('guest-email')?.value.trim();
    const phone = document.getElementById('guest-phone')?.value.trim();
    if (!name) { showToast('Please enter your name'); return false; }
    if (!email || !email.includes('@')) { showToast('Please enter a valid email'); return false; }
    if (!phone) { showToast('Please enter your phone number'); return false; }
  }
  return true;
}

const submitBtn = document.getElementById('submit-booking');
if (submitBtn) {
  submitBtn.addEventListener('click', () => {
    if (!validateStep(currentStep)) return;
    document.querySelector('.booking-form-wrap').style.display = 'none';
    const confirm = document.getElementById('booking-confirm');
    if (confirm) { confirm.classList.add('show'); fillConfirm(); }
  });
}

function fillConfirm() {
  const map = { 'confirm-name': document.getElementById('guest-name')?.value, 'confirm-date': document.getElementById('selected-date')?.textContent, 'confirm-time': document.getElementById('selected-time')?.textContent, 'confirm-guests': document.getElementById('guest-count')?.value, 'confirm-phone': document.getElementById('guest-phone')?.value };
  Object.entries(map).forEach(([id, val]) => { const el = document.getElementById(id); if (el && val) el.textContent = val; });
}

function updateConfirmSummary() {
  const sumDate = document.getElementById('sum-date');
  const sumTime = document.getElementById('sum-time');
  const selDate = document.getElementById('selected-date')?.textContent;
  const selTime = document.getElementById('selected-time')?.textContent;
  if (sumDate && selDate && selDate !== '—') sumDate.textContent = selDate;
  if (sumTime && selTime && selTime !== '—') sumTime.textContent = selTime;
}

const guestSelect = document.getElementById('guest-count');
if (guestSelect) {
  guestSelect.addEventListener('change', () => { const sumGuests = document.getElementById('sum-guests'); if (sumGuests) sumGuests.textContent = guestSelect.value + ' Guests'; });
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = 'position:fixed; bottom:5rem; left:50%; transform:translateX(-50%); background:var(--black-card); border:1px solid var(--gold); color:var(--cream); padding:0.8rem 1.8rem; font-size:0.82rem; z-index:9999; transition:opacity 0.3s; letter-spacing:0.05em;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.style.opacity = '0', 2800);
}

const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('[type="submit"]');
    btn.textContent = 'Sending…';
    btn.disabled = true;
    setTimeout(() => { showToast('Your message has been sent. We will be in touch shortly.'); contactForm.reset(); btn.textContent = 'Send Message'; btn.disabled = false; }, 1200);
  });
}

document.querySelectorAll('[data-whatsapp]').forEach(el => {
  el.addEventListener('click', () => {
    const phone = '+15551234567';
    const msg = encodeURIComponent('Hello Sakura Omakase, I would like to make a reservation.');
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
  });
});

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) { e.preventDefault(); const y = target.getBoundingClientRect().top + window.scrollY - 96; window.scrollTo({ top: y, behavior: 'smooth' }); }
  });
});
