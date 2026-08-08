const THEME_KEY='tinyCompanionSpellbook.theme';
function setTheme(theme){
  const dark=theme==='dark';
  document.documentElement.dataset.theme=dark?'dark':'light';
  localStorage.setItem(THEME_KEY,dark?'dark':'light');
  const btn=document.getElementById('themeToggle');
  if(btn){
    btn.textContent=dark?'☀':'☾';
    btn.setAttribute('aria-pressed',String(dark));
    btn.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');
    btn.title=dark?'Switch to light mode':'Switch to dark mode';
  }
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.setAttribute('content',dark?'#17131b':'#775c96');
}
function getInitialTheme(){
  const saved=localStorage.getItem(THEME_KEY);
  if(saved==='dark'||saved==='light')return saved;
  return window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
}
setTheme(getInitialTheme());
window.addEventListener('DOMContentLoaded',()=>{
  const btn=document.getElementById('themeToggle');
  if(!btn)return;
  setTheme(document.documentElement.dataset.theme||getInitialTheme());
  btn.addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
});
