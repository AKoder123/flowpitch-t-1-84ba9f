'use strict';

async function loadContent(){
  try{
    const res = await fetch('content.json');
    if(!res.ok) throw new Error('Failed to load content.json');
    return await res.json();
  }catch(e){
    console.error(e);
    return null;
  }
}

function createSlideElement(s){
  const wrap = document.createElement('div');
  wrap.className = 'slide' + (s.type?(' '+s.type):'');

  const title = document.createElement('h1');
  title.className = 'title';
  title.textContent = s.title || '';
  wrap.appendChild(title);

  if(s.subtitle){
    const sub = document.createElement('div');
    sub.className = 'subtitle';
    sub.textContent = s.subtitle;
    wrap.appendChild(sub);
  }

  if(Array.isArray(s.bullets) && s.bullets.length){
    const ul = document.createElement('ul');
    ul.className = 'list';
    s.bullets.forEach(b => {
      const li = document.createElement('li');
      li.textContent = b;
      ul.appendChild(li);
    });
    wrap.appendChild(ul);
  }

  if(s.timedSteps && s.timedSteps.length){
    const ul = document.createElement('ul');
    ul.className = 'list';
    s.timedSteps.forEach(step => {
      const li = document.createElement('li');
      li.textContent = step;
      ul.appendChild(li);
    });
    wrap.appendChild(ul);
  }

  if(s.note){
    const sp = document.createElement('div');
    sp.className = 'speaker';
    sp.textContent = s.note;
    sp.style.display = 'none'; // toggleable
    wrap.appendChild(sp);
  }

  // progress bar optional
  const pb = document.createElement('div');
  pb.className = 'progressbar';
  const inner = document.createElement('i');
  pb.appendChild(inner);
  wrap.appendChild(pb);

  return wrap;
}

function renderSlide(deck, idx){
  const slideRoot = document.getElementById('slide');
  slideRoot.innerHTML = '';
  const s = deck.slides[idx];
  const el = createSlideElement(s);
  slideRoot.appendChild(el);
  // update progress
  document.getElementById('progress').textContent = (idx+1) + ' / ' + deck.slides.length;
  // set progress bar
  const percent = Math.round(((idx+1)/deck.slides.length)*100);
  const bar = el.querySelector('.progressbar > i');
  if(bar) bar.style.width = percent + '%';
}

function findSpeakerEls(){
  return Array.from(document.querySelectorAll('.speaker'));
}

function enableControls(deck){
  let cur = 0;
  renderSlide(deck, cur);

  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const notesBtn = document.getElementById('notesToggle');
  const slideRoot = document.getElementById('slide');

  function go(i){
    cur = Math.max(0, Math.min(deck.slides.length-1, i));
    renderSlide(deck, cur);
  }

  prevBtn.addEventListener('click', ()=> go(cur-1));
  nextBtn.addEventListener('click', ()=> go(cur+1));

  document.addEventListener('keydown', (e)=>{
    if(e.key === 'ArrowRight' || e.key === 'PageDown') go(cur+1);
    if(e.key === 'ArrowLeft' || e.key === 'PageUp') go(cur-1);
  });

  // notes toggle: show/hide speaker boxes
  notesBtn.addEventListener('click', ()=>{
    const speakerEls = findSpeakerEls();
    const isShown = speakerEls.length && speakerEls[0].style.display !== 'none';
    speakerEls.forEach(el => el.style.display = isShown ? 'none' : 'block');
    notesBtn.setAttribute('aria-pressed', String(!isShown));
  });

  // touch swipe support
  let startX = null;
  slideRoot.addEventListener('touchstart', (e)=>{ startX = e.changedTouches[0].clientX; });
  slideRoot.addEventListener('touchend', (e)=>{
    if(startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if(Math.abs(dx) > 50){
      if(dx < 0) go(cur+1); else go(cur-1);
    }
    startX = null;
  });

  // double-tap to toggle notes
  let lastTap = 0;
  slideRoot.addEventListener('click', (e)=>{
    const now = Date.now();
    if(now - lastTap < 300){
      // double tap
      notesBtn.click();
    }
    lastTap = now;
  });

  // expose for debugging
  return {go};
}

(async function init(){
  const deck = await loadContent();
  if(!deck){
    document.getElementById('slide').textContent = 'Failed to load deck.';
    return;
  }
  document.querySelector('.brand').textContent = deck.title || 'Deck';
  enableControls(deck);
})();
