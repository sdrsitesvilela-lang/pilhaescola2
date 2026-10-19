// Decorative introduction; independent from application initialization.
(() => {
  const intro = document.getElementById('intro');
  if (!intro) return;
  const finish = () => intro.classList.add('finished');
  const fallback = setTimeout(finish, 2900);
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.getElementById('introPercent').textContent = '100%';
      document.getElementById('introBar').style.width = '100%';
      finish(); clearTimeout(fallback); return;
    }
    const started = performance.now();
    function frame(now) {
      const progress = Math.min(100, Math.floor((now - started) / 24));
      document.getElementById('introPercent').textContent = progress + '%';
      document.getElementById('introBar').style.width = progress + '%';
      if (progress < 100) requestAnimationFrame(frame);
      else { setTimeout(finish, 100); clearTimeout(fallback); }
    }
    requestAnimationFrame(frame);
  } catch (_) { finish(); }
})();
