(() => {
  'use strict';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Content is visible without JavaScript; observers only add decoration.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(({target,isIntersecting}) => {
        target.classList.toggle('entered', isIntersecting && !motion.matches);
      });
    }, {threshold:0.08});
    document.querySelectorAll('.story-chapter,.report-section,.team-member').forEach(el=>observer.observe(el));
  }
  const chapters = [...document.querySelectorAll('.story-chapter')];
  const phone = document.getElementById('storyPhone');
  if (!phone || !chapters.length) return;
  let pending=false, current=-1;
  function update() {
    pending=false;
    const target=innerWidth<=700?Math.min(innerHeight-40,330):innerHeight*.48;
    let active=0;
    chapters.forEach((chapter,index)=>{if(chapter.getBoundingClientRect().top<=target)active=index;});
    const rect=chapters[active].getBoundingClientRect();
    const progress=Math.min(1,Math.max(0,(target-rect.top)/rect.height));
    if(current!==active){
      current=active;
      const chapter=chapters[active],number=String(active+1).padStart(2,'0');
      document.getElementById('phoneEra').textContent=chapter.dataset.era;
      document.getElementById('phoneHeadline').textContent=chapter.dataset.headline;
      document.getElementById('phoneCaption').textContent=chapter.dataset.caption;
      document.getElementById('phoneChapter').textContent=number;
      document.getElementById('chapterCounter').textContent=number+' / 06';
      phone.dataset.chapter=String(active+1);
      // Mobile mirrors the screen caption at a comfortable reading size.
      document.querySelector('.stage-note').textContent=chapter.dataset.caption+' Ilustração conceitual.';
    }
    phone.style.setProperty('--turn',motion.matches?'0deg':(-8+progress*16)+'deg');
    phone.style.setProperty('--tilt',motion.matches?'0deg':(-2+progress*4)+'deg');
    phone.style.setProperty('--trace',String(motion.matches?0:120*(1-progress)));
    document.getElementById('storyProgress').style.width=((active+progress)/chapters.length*100)+'%';
  }
  function schedule(){if(!pending){pending=true;requestAnimationFrame(update);}}
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  addEventListener('pageshow',schedule);
  motion.addEventListener('change',schedule);
  document.addEventListener('visibilitychange',()=>{
    document.body.classList.toggle('ambient-paused',document.hidden);
    if(!document.hidden)schedule();
  });
  update();
})();
