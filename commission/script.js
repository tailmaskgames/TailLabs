const { t } = window.commissionI18n;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const desktopRail = window.matchMedia('(min-width: 1100px)');

/* Navigation: full-screen menu on phones, fixed rail on wide screens. */
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function setMenu(open) {
  navigation.classList.toggle('open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', t(open ? '關閉導覽選單' : '開啟導覽選單'));
  document.body.classList.toggle('dialog-open', open && !desktopRail.matches);
}
menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuButton.focus();
  }
});
desktopRail.addEventListener('change', () => setMenu(false));

/* Scroll spy for the rail. */
const navLinks = [...navigation.querySelectorAll('.nav-list a')];
const spyTargets = navLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
if ('IntersectionObserver' in window) {
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        if (link.getAttribute('href') === `#${entry.target.id}`) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  spyTargets.forEach((section) => spy.observe(section));
}

/* Hero: remix the stacked spheres. */
const remixButton = document.querySelector('#remix');
const heroOrbField = document.querySelector('#hero-orb-field');
const heroOrbImages = [...heroOrbField.querySelectorAll('.orb-art')];
const artworkOptions = [
  './assets/snakes/curled-sleep.png',
  './assets/snakes/tail-glide.png',
  './assets/snakes/sleeping-basket.png',
  './assets/snakes/jumping-laugh.png',
  './assets/snakes/strawberry-tail.png',
  './assets/snakes/stack-play.png',
];
let remixCount = 0;
let artworkChanging = false;
remixButton.addEventListener('click', async () => {
  if (artworkChanging) return;
  artworkChanging = true;
  const nextIndex = (remixCount + 1) % artworkOptions.length;
  try {
    await Promise.all(heroOrbImages.map((_, index) => {
      const image = new Image();
      image.src = artworkOptions[(index + nextIndex) % artworkOptions.length];
      return image.decode();
    }));
    heroOrbField.classList.add('is-changing');
    window.setTimeout(() => {
      heroOrbImages.forEach((image, index) => {
        image.src = artworkOptions[(index + nextIndex) % artworkOptions.length];
      });
      remixCount = nextIndex;
      requestAnimationFrame(() => heroOrbField.classList.remove('is-changing'));
      artworkChanging = false;
    }, 200);
  } catch {
    artworkChanging = false;
  }
});

/* Reveal on scroll (once). */
if ('IntersectionObserver' in window && !reduceMotion) {
  document.documentElement.classList.add('reveal-ready');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
}

/* Showcase tabs. */
const tabs = [...document.querySelectorAll('[role="tab"]')];
const segmented = document.querySelector('.segmented');
const art = document.querySelector('.showcase-art');
const exampleContact = document.querySelector('#example-contact');
const examples = {
  basic: { label: '基本方案示例', plan: '基本方案', chips: ['核心玩法', '堆疊與計分', '失敗後重來'] },
  advanced: { label: '進階方案示例', plan: '進階方案', chips: ['操作引導', '難度變化', '音樂與動態'] },
  deluxe: { label: '豪華方案擴充構想', plan: '豪華方案', chips: ['多種模式', '特殊蛇貂', '升級與成就'] },
};
function selectExample(mode, moveFocus = false) {
  if (!examples[mode]) return;
  const changed = art.dataset.mode !== mode;
  tabs.forEach((tab, index) => {
    const selected = tab.dataset.mode === mode;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
    if (selected) segmented.style.setProperty('--idx', index);
    if (selected && moveFocus) tab.focus();
  });
  art.dataset.mode = mode;
  document.querySelector('#example-status').textContent = t(examples[mode].label);
  art.querySelectorAll('.example-chip').forEach((chip, index) => {
    chip.textContent = t(examples[mode].chips[index]);
    if (changed) { chip.style.animation = 'none'; void chip.offsetWidth; chip.style.animation = ''; }
  });
  exampleContact.dataset.plan = examples[mode].plan;
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectExample(tab.dataset.mode));
  tab.addEventListener('keydown', (event) => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      selectExample(tabs[next].dataset.mode, true);
    }
  });
});
document.querySelectorAll('[data-example]').forEach((link) => {
  link.addEventListener('click', () => selectExample(link.dataset.example));
});

/* Cancellation calculator. */
const quoteInput = document.querySelector('#quote-input');
const progressInput = document.querySelector('#progress-input');
const feeMeter = document.querySelector('.fee-meter');
function updateCancellation() {
  const amountFormatter = new Intl.NumberFormat(window.commissionI18n.locale, { maximumFractionDigits: 2 });
  const progress = Number(progressInput.value);
  const quote = Number(quoteInput.value);
  const rate = 30 + 0.4 * progress;
  const validQuote = quoteInput.value.trim() !== '' && Number.isFinite(quote) && quote >= 1 && quote <= 10000000;
  document.querySelector('#progress-output').textContent = `${progress}%`;
  document.querySelector('#fee-rate').textContent = t('（報價的 {rate}%）', { rate: Number(rate.toFixed(1)) });
  document.querySelector('#fee-amount').textContent = validQuote ? `NT$${amountFormatter.format(quote * rate / 100)}` : t('請輸入有效報價');
  feeMeter.style.setProperty('--rate', rate);
}
quoteInput.addEventListener('input', updateCancellation);
progressInput.addEventListener('input', updateCancellation);
updateCancellation();

/* Commission brief dialog. */
const briefDialog = document.querySelector('#brief-dialog');
const briefPlan = document.querySelector('#brief-plan');
const briefMessage = document.querySelector('#brief-message');
const copyStatus = document.querySelector('#copy-status');
let briefUserEdited = false;
function createBrief() {
  return [
    t('Hi，浣熊拉芙，我想聊聊遊戲委託！'),
    '',
    t('委託方案：') + t(briefPlan.value),
    t('遊戲想法／參考作品：'),
    t('預算範圍：'),
    t('期望完成時間：'),
    t('目前準備好的美術素材：'),
    t('其他想討論的內容：'),
  ].join('\n');
}
briefMessage.value = createBrief();
function setBriefPlan(plan) {
  if (![...briefPlan.options].some((option) => option.value === plan)) return;
  briefPlan.value = plan;
  const line = t('委託方案：') + t(plan);
  const planLine = /^(?:委託方案：|Commission plan:|ご希望のプラン：).*$/m;
  briefMessage.value = planLine.test(briefMessage.value)
    ? briefMessage.value.replace(planLine, () => line)
    : `${line}\n${briefMessage.value}`;
}
function openBrief(plan) {
  if (plan) setBriefPlan(plan);
  copyStatus.textContent = '';
  if (!briefDialog.open) {
    briefDialog.showModal();
    document.body.classList.add('dialog-open');
  }
}
document.querySelector('#open-brief').addEventListener('click', () => openBrief());
document.querySelectorAll('[data-plan]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    openBrief(link.dataset.plan);
  });
});
briefPlan.addEventListener('change', () => { setBriefPlan(briefPlan.value); copyStatus.textContent = ''; });
briefMessage.addEventListener('input', () => { briefUserEdited = true; copyStatus.textContent = ''; });
document.querySelector('.dialog-close').addEventListener('click', () => briefDialog.close());
briefDialog.addEventListener('click', (event) => {
  if (event.target !== briefDialog) return;
  const rect = briefDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) briefDialog.close();
});
briefDialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
document.querySelector('#copy-brief').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(briefMessage.value);
    copyStatus.textContent = t('複製好了，到 Discord 貼上就可以。');
  } catch {
    briefMessage.focus();
    briefMessage.select();
    try {
      const copied = document.execCommand('copy');
      copyStatus.textContent = t(copied ? '複製好了，到 Discord 貼上就可以。' : '已選取訊息，請手動複製後貼到 Discord。');
    } catch {
      copyStatus.textContent = t('已選取訊息，請手動複製後貼到 Discord。');
    }
  }
});

window.addEventListener('commission-languagechange', () => {
  selectExample(art.dataset.mode);
  updateCancellation();
  menuButton.setAttribute('aria-label', t(menuButton.getAttribute('aria-expanded') === 'true' ? '關閉導覽選單' : '開啟導覽選單'));
  if (!briefUserEdited) briefMessage.value = createBrief();
  copyStatus.textContent = '';
});
selectExample(art.dataset.mode);
