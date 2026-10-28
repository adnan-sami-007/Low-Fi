const $ = id => document.getElementById(id);
let scene = 1, holding = false, startedAt = 0, progress = 0, frameId = 0, stageIndex = -1, complete = false;
const DURATION = 12500;
const labels = ['AFTER GRADUATION', 'AFTER I GET A GOOD JOB', 'AFTER I SUCCEED', 'NOT YET…'];

function render() {
  $('phase').textContent = `LOW-FI / SCENE ${scene} OF 5`;
  const steps = ['Present', 'Expectation', 'Waiting', 'Moving goal', 'Realization'];
  $('storyline').innerHTML = steps.map((x, i) => `<span class="story-step ${i + 1 === scene ? 'current' : i + 1 < scene ? 'past' : ''}">${x}</span>`).join('');
  $('futureChair').classList.toggle('active', scene >= 2 && scene <= 4);
  $('hint').textContent = scene === 1 ? 'A ROOM. TWO CHAIRS. ONE POSSIBILITY.' : scene === 2 ? 'THE EMPTY CHAIR IS WAITING.' : scene === 3 ? 'TIME PASSES WHILE YOU HOLD.' : scene === 4 ? 'THE FINISH LINE MOVES.' : 'THE ROOM IS STILL HERE.';
  $('clock').classList.toggle('animated', scene === 3 || scene === 4);
  $('beam').style.opacity = scene === 5 ? '.78' : '.4';
  $('roomFade').style.opacity = scene === 5 ? '.17' : '0';
  if (scene !== 3 && scene !== 4) {
    $('milestone').classList.remove('visible');
    $('ghost').style.opacity = '0'
  }
  const panels = {
    1: `<div class="eyebrow">01 · The present</div><h1 class="heading">I'll start living when…</h1><p class="copy">A quiet room. One person is here. Another chair is empty. Which version of yourself are you waiting for?</p><button class="action" id="go">Enter the room →</button><span class="micro">You can also select the empty chair.</span>`,
    2: `<div class="eyebrow">02 · Expectation</div><h1 class="heading">Who are you waiting for?</h1><p class="copy">There is someone you expect to become. More confident. More successful. Finally enough. But the chair is still empty.</p><button class="action" id="go">Wait for them →</button>`,
    3: `<div class="eyebrow">03 · Waiting</div><h1 class="heading">Just a little longer.</h1><p class="copy">Press and hold the button. Watch what happens to the chair. Release whenever you want.</p><button class="action hold" id="hold" aria-label="Press and hold to wait">Press and hold</button><div class="progressbar"><div class="fill" id="fill"></div></div><div class="progresslabel" id="progresslabel">0 seconds of waiting</div><span class="micro">Hold for about 12 seconds. Release at any moment to pause; hold again to continue. Keyboard: Space or Enter on the button.</span>`,
    4: `<div class="eyebrow">04 · The moving goal</div><h1 class="heading">Almost. But not yet.</h1><p class="copy">The figure nearly appears, but each milestone is replaced by another. The chair remains empty.</p><button class="action" id="go">Stop waiting →</button><button class="action secondary" id="again">Wait again ↺</button>`,
    5: `<div class="eyebrow">05 · Realization</div><h1 class="heading">You were here all along.</h1><p class="copy">The imagined future self never fully arrived. But your present self was here the whole time.</p><p class="end-line">What version of yourself are you waiting for?</p><button class="action secondary" id="go">Experience again ↺</button>`
  };
  $('panel').innerHTML = panels[scene];
  if ($('go')) $('go').addEventListener('click', () => scene === 5 ? reset() : next());
  if ($('again')) $('again').addEventListener('click', () => { scene = 3; resetHold(); render() });
  if ($('hold')) wireHold($('hold'));
}

function next() {
  if (scene < 5) { scene++; render() }
}

function resetHold() {
  holding = false;
  cancelAnimationFrame(frameId);
  progress = 0;
  stageIndex = -1;
  complete = false;
  $('milestone').classList.remove('visible');
  $('ghost').style.opacity = 0
}

function reset() {
  resetHold();
  scene = 1;
  render()
}

function wireHold(btn) {
  function down(e) {
    if (e.type === 'pointerdown') { e.preventDefault(); btn.setPointerCapture?.(e.pointerId) }
    if (holding || complete) return;
    holding = true;
    startedAt = performance.now() - progress * DURATION;
    tick()
  }
  function up() {
    if (!holding) return;
    holding = false;
    cancelAnimationFrame(frameId);
    btn.textContent = 'Continue holding';
    if (progress < 1) { $('ghost').style.opacity = Math.max(0, (progress * .12)).toFixed(2) }
  }
  function tick() {
    if (!holding) return;
    progress = Math.min(1, (performance.now() - startedAt) / DURATION);
    $('fill').style.width = (progress * 100).toFixed(2) + '%';
    $('progresslabel').textContent = Math.floor(progress * DURATION / 1000) + ' seconds of waiting';
    const ix = Math.min(3, Math.floor(progress * 4));
    if (ix !== stageIndex) {
      stageIndex = ix;
      $('milestone').textContent = labels[ix];
      $('milestone').classList.add('visible')
    }
    const opacity = progress < .78 ? progress * .7 : Math.max(0, (1 - progress) / .22 * .55);
    $('ghost').style.opacity = String(Math.max(0, opacity));
    if (progress >= 1) {
      holding = false;
      complete = true;
      cancelAnimationFrame(frameId);
      scene = 4;
      render();
      $('milestone').textContent = 'NOT YET…';
      $('milestone').classList.add('visible');
      return
    }
    frameId = requestAnimationFrame(tick)
  }
  btn.addEventListener('pointerdown', down);
  btn.addEventListener('pointerup', up);
  btn.addEventListener('pointercancel', up);
  btn.addEventListener('lostpointercapture', up);
  btn.addEventListener('keydown', e => { if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) { e.preventDefault(); down(e) } });
  btn.addEventListener('keyup', e => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); up() } });
  window.addEventListener('blur', up, { once: true });
}

$('reset').addEventListener('click', reset);
$('showNotes').addEventListener('click', () => { const n = $('notes'); const open = n.classList.toggle('open'); $('showNotes').setAttribute('aria-expanded', String(open)); if (open) $('closeNotes').focus() });
$('closeNotes').addEventListener('click', () => { $('notes').classList.remove('open'); $('showNotes').setAttribute('aria-expanded', 'false'); $('showNotes').focus() });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { $('notes').classList.remove('open'); $('showNotes').setAttribute('aria-expanded', 'false') } });
$('futureChair').addEventListener('click', () => { if (scene === 1 || scene === 2) next() });
$('futureChair').addEventListener('keydown', e => { if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); if (scene <= 2) next() } });
render();