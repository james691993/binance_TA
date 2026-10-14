const views=['overview','chart','duo'],loaded=new Set(),dirty=new Set();let active;
function resolve(){const hash=location.hash.slice(1);if(views.includes(hash))return hash;try{const saved=localStorage.getItem('trend-hub-view');if(views.includes(saved))return saved}catch{}return 'overview'}
function show(id){active=id;for(const view of views){const current=view===id,panel=document.getElementById('panel-'+view),button=document.getElementById('tab-'+view);panel.hidden=!current;button.setAttribute('aria-selected',String(current));button.tabIndex=current?0:-1}
  if(!loaded.has(id)||dirty.has(id)){document.getElementById('view-'+id).src='views/'+id+'/index.html';loaded.add(id);dirty.delete(id)}
  try{localStorage.setItem('trend-hub-view',id)}catch{}
  document.title='Trend Desk · '+document.getElementById('tab-'+id).textContent.trim().replace(/^\d+\s*/,'');
}
function select(id){if(location.hash==='#'+id)show(id);else location.hash=id}
document.querySelector('.hub-tabs').addEventListener('click',e=>{const button=e.target.closest('[data-view]');if(button)select(button.dataset.view)});
document.querySelector('.hub-tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const index=views.indexOf(e.target.dataset.view);if(index<0)return;const next=e.key==='Home'?0:e.key==='End'?views.length-1:(index+(e.key==='ArrowRight'?1:-1)+views.length)%views.length;select(views[next]);document.getElementById('tab-'+views[next]).focus()});
window.addEventListener('hashchange',()=>show(resolve()));
window.addEventListener('storage',event=>{if(!['trend-hub-coins','trend-hub-symbol'].includes(event.key))return;for(const view of views)if(view!==active)dirty.add(view)});
show(resolve());
