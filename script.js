/* script.js — core interactions for the site */

/* ---------- Utilities ---------- */
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));

/* ---------- Page transition & typed headline ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // small page load fade-in
  setTimeout(()=>document.querySelector('.page-transition').style.opacity = 0, 10);

  // typed headline on index
  const typedEl = document.getElementById('typed');
  if(typedEl){
    const phrases = ['Build a Modern Resume.', 'Upgrade Your Career.', 'Get Interview Ready.'];
    let i=0, j=0, typing=true;
    function tick(){
      const current = phrases[i];
      if(typing){
        j++;
        typedEl.textContent = current.slice(0,j);
        if(j===current.length){ typing=false; setTimeout(tick,1200); return; }
      } else {
        j--;
        typedEl.textContent = current.slice(0,j);
        if(j===0){ typing=true; i=(i+1)%phrases.length; }
      }
      setTimeout(tick, typing?120:40);
    }
    tick();
  }
});

/* ---------- Dark mode toggles (multiple pages compatibility) ---------- */
function toggleDark(){
  document.body.classList.toggle('dark');
  localStorage.setItem('myresume:dark', document.body.classList.contains('dark') ? '1' : '0');
}
['darkToggle','darkToggleTop','darkToggleResume','darkToggleContact'].forEach(id=>{
  const el = document.getElementById(id);
  if(el) el.addEventListener('click', toggleDark);
});
if(localStorage.getItem('myresume:dark') === '1') document.body.classList.add('dark');

/* ---------- Back to top ---------- */
const backBtns = $$('.back-to-top');
window.addEventListener('scroll', () => {
  const show = window.scrollY > 400;
  backBtns.forEach(b => b.style.display = show ? 'block' : 'none');
});
backBtns.forEach(b => b.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'})));

/* ---------- Accordion (FAQ) ---------- */
$$('.acc-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const panel = btn.nextElementSibling;
    const open = panel.style.maxHeight && panel.style.maxHeight !== '0px';
    // close all
    $$('.acc-panel').forEach(p => p.style.maxHeight = 0);
    $$('.acc-btn').forEach(x => x.classList.remove('open'));
    if(!open){
      panel.style.maxHeight = panel.scrollHeight + 'px';
      btn.classList.add('open');
    }
  });
});

/* ---------- Contact form (fake) ---------- */
const contactForm = $('#contactForm');
if(contactForm){
  contactForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    // simple validation
    const n = $('#cname').value.trim(), em = $('#cemail').value.trim(), m = $('#cmessage').value.trim();
    if(!n||!em||!m){ alert('Please fill all fields.'); return; }
    alert('Thanks — message sent (simulated).');
    contactForm.reset();
  });
}

/* ---------- Resume builder logic ---------- */
const isResumePage = document.body.classList.contains('page-resume');
if(isResumePage){
  // elements
  const fields = ['name','title','email','phone','summary','skills','experience'];
  const els = {};
  fields.forEach(f => els[f] = document.getElementById(f));
  const photoInput = document.getElementById('photo');
  const preview = document.getElementById('preview');
  const rp = {
    name: document.getElementById('r-name'),
    title: document.getElementById('r-title'),
    email: document.getElementById('r-email'),
    phone: document.getElementById('r-phone'),
    summary: document.getElementById('r-summary'),
    skills: document.getElementById('r-skills'),
    experience: document.getElementById('r-experience'),
    photo: document.getElementById('rp-photo')
  };

  // update function
  function updatePreview(){
    rp.name.textContent = els.name.value || 'Your Name';
    rp.title.textContent = els.title.value || 'Job Title';
    rp.email.textContent = els.email.value || '';
    rp.phone.textContent = els.phone.value || '';
    rp.summary.textContent = els.summary.value || 'A short professional summary will appear here.';
    // skills
    const sk = (els.skills.value || '').split(',').map(s=>s.trim()).filter(Boolean);
    rp.skills.innerHTML = sk.length ? sk.map(x=>`<li>${x}</li>`).join('') : '<li>HTML</li><li>CSS</li><li>JavaScript</li>';
    rp.experience.innerHTML = els.experience.value || 'Add your experience here.';
    // template switch
    const template = document.querySelector('input[name="template"]:checked')?.value || 'modern';
    preview.className = 'resume-preview ' + template;
    // accent color
    const accent = document.getElementById('accent').value;
    preview.style.setProperty('--accent', accent);
    // save live draft
    saveDraftDebounced();
  }

  // initial bind
  fields.forEach(f => {
    if(els[f]) els[f].addEventListener('input', updatePreview);
  });
  document.querySelectorAll('input[name="template"]').forEach(r => r.addEventListener('change', updatePreview));
  document.getElementById('accent').addEventListener('change', updatePreview);

  // photo upload
  if(photoInput){
    photoInput.addEventListener('change', (e)=>{
      const f = e.target.files[0];
      if(!f) return;
      const reader = new FileReader();
      reader.onload = ev => {
        rp.photo.style.backgroundImage = `url('${ev.target.result}')`;
        // save photo to localStorage as dataURL (if small)
        try {
          localStorage.setItem('myresume:photo', ev.target.result);
        } catch(err){ console.warn('Photo too large to save locally'); }
      };
      reader.readAsDataURL(f);
    });
    // load stored photo if any
    const storedPhoto = localStorage.getItem('myresume:photo');
    if(storedPhoto) rp.photo.style.backgroundImage = `url('${storedPhoto}')`;
  }

  // Save / Load / Reset
  function saveDraft(){
    const data = {};
    fields.forEach(f => data[f] = els[f].value);
    data.template = document.querySelector('input[name="template"]:checked')?.value || 'modern';
    data.accent = document.getElementById('accent').value;
    localStorage.setItem('myresume:draft', JSON.stringify(data));
    // photo already saved separately
  }
  const saveDraftDebounced = debounce(saveDraft, 500);

  function loadDraft(){
    const raw = localStorage.getItem('myresume:draft');
    if(!raw) return;
    try {
      const data = JSON.parse(raw);
      fields.forEach(f => els[f].value = data[f] || '');
      if(data.template) document.querySelector(`input[name="template"][value="${data.template}"]`).checked = true;
      if(data.accent) document.getElementById('accent').value = data.accent;
      updatePreview();
    } catch(e){ console.warn('Invalid draft'); }
  }

  function resetDraft(){
    if(!confirm('Reset the form?')) return;
    fields.forEach(f => els[f].value = '');
    document.querySelector('input[name="template"][value="modern"]').checked = true;
    document.getElementById('accent').value = '#007bff';
    localStorage.removeItem('myresume:draft');
    localStorage.removeItem('myresume:photo');
    rp.photo.style.backgroundImage = "url('assets/placeholder-avatar.png')";
    updatePreview();
  }

  $('#saveBtn').addEventListener('click', ()=>{
    saveDraft();
    alert('Saved locally.');
  });
  $('#loadBtn').addEventListener('click', ()=> {
    loadDraft();
    alert('Loaded draft (if any).');
  });
  $('#resetBtn').addEventListener('click', resetDraft);

  // print/export (simple)
  $('#printBtn').addEventListener('click', ()=>{
    // apply print styles if needed, then open print dialog
    window.print();
  });

  // helper: toggle print-only style — for previewing print layout locally
  $('#previewOnlyBtn').addEventListener('click', ()=>{
    document.querySelector('.resume-preview').classList.toggle('print-preview');
  });

  // init
  loadDraft();
  updatePreview();
}

/* ---------- Debounce helper ---------- */
function debounce(fn, wait){
  let t;
  return function(...args){
    clearTimeout(t);
    t = setTimeout(()=> fn.apply(this,args), wait);
  };
}

/* ---------- Smooth internal page navigation (simple) ---------- */
document.querySelectorAll('a[href]').forEach(a=>{
  const href = a.getAttribute('href');
  if(!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http')) return;
  a.addEventListener('click', (e)=>{
    // small fade
    document.querySelector('.page-transition').style.opacity = 1;
    setTimeout(()=> location.href = href, 200);
    e.preventDefault();
  });
});

/* ---------- Small UX niceties ---------- */
// Show tooltips or similar could go here
