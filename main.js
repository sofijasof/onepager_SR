const camera = document.getElementById("camera");
const spacer = document.getElementById("spacer");
const cards = [...document.querySelectorAll(".card")];
const progressBar = document.getElementById("progressBar");
const brandBtn = document.getElementById("brandBtn");

const intro = document.getElementById("intro");
const introWord = document.getElementById("introWord");
const scrollHint = document.getElementById("scrollHint");

const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
function preventScroll(e){ e.preventDefault(); }

const cfg = {
  spacing: 950,
  ease: 0.12,
  smallScale: 0.62,
  fadeOutStrength: 1.15,
  previewScaleBoost: 0.12, 

  previewMax: 0.28,     // max preview opacity for the next slide
};

cards.forEach((c,i)=>{
  c.dataset.z = -i * cfg.spacing;
});

const maxTravel = (cards.length - 1) * cfg.spacing;
spacer.style.height = `${maxTravel + window.innerHeight}px`;

let allowScroll = false;
const state = { target: 0, z: 0 };

window.addEventListener("scroll",()=>{
  if(!allowScroll) return;
  state.target = clamp(window.scrollY, 0, maxTravel);
},{ passive:true });

function updateProgress(){
  const p = maxTravel === 0 ? 0 : clamp(state.z / maxTravel, 0, 1);
  progressBar.style.width = `${p * 100}%`;
}

function updateCards() {

  // Current index approx = round(state.z / spacing)
  const currentIndex = clamp(Math.round(state.z / cfg.spacing), 0, cards.length - 1);
  const nextIndex = clamp(currentIndex + 1, 0, cards.length - 1);

  const disablePreview = cards[currentIndex]?.classList.contains("no-preview");

  cards.forEach((card, i) => {
    const cz = +card.dataset.z;
    const rel = cz + state.z; // 0 = current

    // closeness to center (0..1)
    const t = clamp(1 - Math.abs(rel) / cfg.spacing, 0, 1);

    // base scale: small -> 1 at center
    const scale = cfg.smallScale + (1 - cfg.smallScale) * t;
    let finalScale = scale;

    // base opacity
    let opacity = t;

    // after passing, fade quicker
    if (rel > 0) {
      const fade = clamp(1 - (rel / cfg.spacing) * cfg.fadeOutStrength, 0, 1);
      opacity = t * fade;
    }

    // slide preview
    if (i === nextIndex) {
      const x = clamp(1 - (-rel / cfg.spacing), 0, 1);

      const boost = cfg.previewScaleBoost * x;
      finalScale = scale + boost;

      if (!disablePreview) {
        const previewOpacity = 0.22 + 0.18 * x;
        opacity = Math.max(opacity, previewOpacity);
      }
    }

    card.style.opacity = opacity.toFixed(3);
    card.style.transform =
      `translate(-50%,-50%) scale(${finalScale.toFixed(4)}) translateZ(${cz}px)`;
  });
}

function tick(){
  state.z += (state.target - state.z) * cfg.ease;
  camera.style.transform = `translate3d(0,0,${state.z}px)`;
  updateCards();
  updateProgress();
  requestAnimationFrame(tick);
}
tick();

/* reset */
brandBtn.onclick = ()=>{
  window.scrollTo({ top: 0, behavior: "smooth" });
  state.target = 0;
};

/* intro */
const sleep = ms => new Promise(r=>setTimeout(r,ms));

function waitForUnlockGesture(){
  return new Promise((resolve) => {
    const done = () => {
      cleanup();
      resolve();
    };

    const onWheel = (e) => {
      // user attempted to scroll
      if (Math.abs(e.deltaY) > 2) done();
    };

    let touchStartY = null;
    const onTouchStart = (e) => {
      touchStartY = e.touches?.[0]?.clientY ?? null;
    };
    const onTouchMove = (e) => {
      const y = e.touches?.[0]?.clientY ?? null;
      if (touchStartY != null && y != null && Math.abs(y - touchStartY) > 6) done();
    };

    const onKeyDown = (e) => {
      const keys = ["ArrowDown", "Space", "PageDown", "Enter"];
      if (keys.includes(e.code)) done();
    };

    function cleanup(){
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKeyDown);
    }

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKeyDown);
  });
}

async function runIntro(){
  document.body.classList.add("lock-scroll");
  window.addEventListener("wheel", preventScroll, { passive:false });
window.addEventListener("touchmove", preventScroll, { passive:false });
  window.scrollTo(0,0);

  scrollHint.classList.add("hidden");

  const seq = ["you","you got","you got this"];
  for(const text of seq){
    introWord.textContent = text;
    introWord.animate(
      [
        { opacity:0, transform:"translate(-50%,-50%) scale(.96)" },
        { opacity:1, transform:"translate(-50%,-50%) scale(1)" }
      ],
      { duration:280, easing:"cubic-bezier(.2,.9,.2,1)" }
    );
    await sleep(520);
  }

  // hold the final phrase
  await sleep(900);

  // scroll instruction 
  scrollHint.classList.remove("hidden");

  // wait until the user actually tries to scroll
  await waitForUnlockGesture();

  // fade out the whole overlay
  intro.animate([{ opacity:1 }, { opacity:0 }], { duration:600, easing:"ease" });
  await sleep(600);

  intro.remove();
  window.removeEventListener("wheel", preventScroll);
window.removeEventListener("touchmove", preventScroll);

window.scrollTo(0,0);
state.target = 0;
state.z = 0;
allowScroll = true;
  allowScroll = true;
  document.body.classList.remove("lock-scroll");
}
runIntro();
