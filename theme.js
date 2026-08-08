const THEME_KEY='tinyCompanionSpellbook.theme';
const BACKUP_KEY='tinyCompanionSpellbook.lastBackup';
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
function updateBackupStatus(){
  const tools=document.getElementById('toolsDialog');
  if(!tools)return;
  let el=document.getElementById('backupStatus');
  if(!el){
    el=document.createElement('p');
    el.id='backupStatus';
    el.className='muted';
    const grid=tools.querySelector('.tool-grid');
    if(grid)grid.before(el);
  }
  const raw=localStorage.getItem(BACKUP_KEY);
  if(!raw){el.textContent='Last backup: Never on this device';return;}
  const d=new Date(raw);
  el.textContent=`Last backup: ${Number.isNaN(d.getTime())?'Unknown':d.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})}`;
}
setTheme(getInitialTheme());
window.addEventListener('DOMContentLoaded',()=>{
  const btn=document.getElementById('themeToggle');
  if(btn){
    setTheme(document.documentElement.dataset.theme||getInitialTheme());
    btn.addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
  }

  const settingsBtn=document.getElementById('settingsBtn');
  if(settingsBtn)settingsBtn.addEventListener('click',()=>setTimeout(updateBackupStatus,0));

  const exportBtn=document.getElementById('exportJsonBtn');
  if(exportBtn){
    const original=exportBtn.onclick;
    exportBtn.onclick=event=>{
      if(typeof original==='function')original.call(exportBtn,event);
      localStorage.setItem(BACKUP_KEY,new Date().toISOString());
      updateBackupStatus();
    };
  }
});
