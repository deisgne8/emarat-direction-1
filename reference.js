document.documentElement.classList.add('js');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const header = document.querySelector('.header');
const main = document.querySelector('main');
const footer = document.querySelector('footer');




const menu = document.querySelector('#main-menu');
const menuToggle = document.querySelector('.menu-toggle');


let menuOpen = false;
let framePending = false, menuCloseTimer;

function wrapWords(element, className) {
  let index = 0;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const fragment = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach(word => {
      if (!word.trim()) { fragment.append(document.createTextNode(word)); return; }
      const mask = document.createElement('span'); mask.className = className;
      const inner = document.createElement('span'); inner.textContent = word;
      mask.style.setProperty('--word', index++); mask.append(inner); fragment.append(mask);
    });
    node.replaceWith(fragment);
  });
}
document.querySelectorAll('[data-hero-title]').forEach(el => wrapWords(el, 'hero-word'));
document.querySelectorAll('h2[data-reveal]').forEach(el => wrapWords(el, 'reveal-word'));

const storyStatement=document.querySelector('[data-scroll-statement]');
if(storyStatement)wrapWords(storyStatement,'story-word');
const storyWords=storyStatement?[...storyStatement.querySelectorAll('.story-word')]:[];
let storyReadCount=-1;
function updateStoryReading(){
  if(!storyStatement)return;
  const bounds=storyStatement.getBoundingClientRect();
  const start=innerHeight*.78,end=-bounds.height*.15;
  const progress=reducedMotion.matches?1:Math.max(0,Math.min(1,(start-bounds.top)/(start-end)));
  const count=Math.round(progress*storyWords.length);
  if(count===storyReadCount)return;
  storyReadCount=count;
  storyWords.forEach((word,index)=>word.classList.toggle('is-read',index<count));
}
document.querySelectorAll('.card-grid').forEach(grid => [...grid.children].forEach((card,i) => card.style.setProperty('--reveal-delay', `${i*90}ms`)));
document.querySelectorAll('.menu-column').forEach((column,i) => column.style.setProperty('--column',i));

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => { if(entry.isIntersecting) { entry.target.classList.add('in-view'); revealObserver.unobserve(entry.target); } });
}, {threshold: .08, rootMargin: '0px 0px -25px 0px'});
document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));

// Count the figures once as the numbers enter the viewport.
const stationStats=document.querySelector('.station-stats');
const stationCounters=[...document.querySelectorAll('[data-count-to]')];
let stationCountFrame=0,stationCountStarted=false;
function finishStationCount(){
  cancelAnimationFrame(stationCountFrame);stationCountFrame=0;
  stationCounters.forEach(counter=>{counter.textContent=counter.dataset.countTo;});
}
function startStationCount(){
  if(stationCountStarted)return;
  stationCountStarted=true;
  if(reducedMotion.matches){finishStationCount();return;}
  const started=performance.now(),duration=1600,stagger=110;
  stationCounters.forEach(counter=>{counter.textContent='0';});
  function tick(time){
    stationCounters.forEach((counter,index)=>{
      const progress=Math.max(0,Math.min(1,(time-started-index*stagger)/duration));
      const eased=1-Math.pow(1-progress,3);
      counter.textContent=Math.round(Number(counter.dataset.countTo)*eased);
    });
    if(time-started<duration+(stationCounters.length-1)*stagger){stationCountFrame=requestAnimationFrame(tick);}
    else finishStationCount();
  }
  stationCountFrame=requestAnimationFrame(tick);
}
if(stationStats){
  const countObserver=new IntersectionObserver(entries=>{
    if(entries.some(entry=>entry.isIntersecting)){
      startStationCount();countObserver.disconnect();
    }
  },{threshold:.3});
  countObserver.observe(stationStats);
  reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)finishStationCount();});
}

const parallaxImages=[...document.querySelectorAll('[data-parallax]')];


function updateScrollMotion(){
  header.classList.toggle('is-scrolled',scrollY>30);
  updateStoryReading();
  if(!reducedMotion.matches){
    parallaxImages.forEach(image=>{
      const bounds=image.parentElement.getBoundingClientRect();
      if(bounds.bottom<0||bounds.top>innerHeight)return;
      const progress=(innerHeight/2-(bounds.top+bounds.height/2))/(innerHeight+bounds.height);
      image.style.transform=`translate3d(0,${progress*14}%,0)`;
    });
  }
  framePending=false;
}
function requestScrollMotion(){if(!framePending){framePending=true;requestAnimationFrame(updateScrollMotion);}}
addEventListener('scroll',requestScrollMotion,{passive:true});
addEventListener('resize',requestScrollMotion);
updateScrollMotion();
reducedMotion.addEventListener('change',requestScrollMotion);

function openMenu(){
  clearTimeout(menuCloseTimer);menu.hidden=false;menuOpen=true;
  main.inert=true;footer.inert=true;
  menuToggle.setAttribute('aria-expanded','true');menuToggle.setAttribute('aria-label','Close navigation');
  requestAnimationFrame(()=>document.body.classList.add('menu-open'));
  
}
function closeMenu(returnFocus=false){
  if(!menuOpen)return;
  menuOpen=false;document.body.classList.remove('menu-open');main.inert=false;footer.inert=false;
  menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label','Open navigation');
  menuCloseTimer=setTimeout(()=>{if(!menuOpen)menu.hidden=true;},450);
  if(returnFocus)menuToggle.focus();
}
menuToggle.addEventListener('click',()=>menuOpen?closeMenu():openMenu());
menu.querySelectorAll('a[href]').forEach(link=>link.addEventListener('click',()=>closeMenu()));
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&menuOpen){closeMenu(true);return;}
  if(event.key==='Tab'&&menuOpen){
    const focusable=[...document.querySelectorAll('.header a[href],.header button,#main-menu a[href],#main-menu button')].filter(el=>el.getClientRects().length);
    const first=focusable[0],last=focusable.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
});

document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{const box=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom))dialog.close();});
});
const searchDialog=document.querySelector('#search-dialog'),searchInput=document.querySelector('#site-search');
const searchable=[
  ['Our heritage','history beginnings evolution story UAE progress','#heritage'],
  ['Natural gas','commercial energy business','#businesses'],
  ['Liquefied petroleum gas','lpg commercial business','#businesses'],
  ['Fuel','petrol diesel commercial business','#businesses'],
  ['Our story','about Emarat experience','#about'],
  ['Our commitment','sustainability responsibility environment resources people safety care','#nation'],
  ['News & insights','media latest announcements','#news']
];
function renderSearch(){
  const query=searchInput.value.trim().toLowerCase(),results=document.querySelector('#search-results');results.replaceChildren();
  const found=searchable.filter(([title,keywords])=>(title+' '+keywords).toLowerCase().includes(query));
  if(!found.length){const p=document.createElement('p');p.textContent='No matching services. Try another word or contact our team.';results.append(p);}
  found.forEach(([title,,url])=>{const link=document.createElement('a');link.textContent=title;link.href=url;link.addEventListener('click',()=>searchDialog.close());results.append(link);});
}
document.querySelectorAll('.search-open').forEach(button=>button.addEventListener('click',()=>{closeMenu();renderSearch();searchDialog.showModal();searchInput.focus();}));
searchInput.addEventListener('input',renderSearch);
document.querySelector('.newsletter-open').addEventListener('click',()=>{document.querySelector('#newsletter-dialog').showModal();document.querySelector('#newsletter-email').focus();});
document.querySelector('.newsletter-form').addEventListener('submit',event=>{event.preventDefault();document.querySelector('.newsletter-status').textContent='Newsletter signup is not connected in this preview. No email address has been submitted.';});

document.querySelector('#year').textContent=new Date().getFullYear();

// Journal-style cursor: reveal vertically, follow softly, catch up before wiping out.
const businessCursor=document.createElement('span');
businessCursor.className='business-cursor';businessCursor.setAttribute('aria-hidden','true');
const cursorMark=document.createElement('span');cursorMark.className='business-cursor-mark';
const arrowSource=document.querySelector('.business-hover-arrow svg');
if(arrowSource)cursorMark.append(arrowSource.cloneNode(true));
businessCursor.append(cursorMark);document.body.append(businessCursor);
const finePointer=matchMedia('(hover:hover) and (pointer:fine)');
let cursorTarget={x:0,y:0},cursorPosition={x:0,y:0},cursorCard=null;
let cursorFrame=0,cursorLastTime=0,cursorExitAt=0,cursorHideTimer=0;
function placeBusinessCursor(){businessCursor.style.transform=`translate3d(${cursorPosition.x+12}px,${cursorPosition.y+17}px,0)`;}
function finishCursorExit(){
  cursorExitAt=0;cursorCard=null;
  businessCursor.classList.remove('is-visible','is-exiting');businessCursor.classList.add('is-leaving');
  cursorHideTimer=setTimeout(()=>businessCursor.classList.remove('is-leaving'),reducedMotion.matches?0:600);
}
function tickBusinessCursor(time){
  cursorFrame=0;
  const elapsed=cursorLastTime?Math.min(time-cursorLastTime,50):16;cursorLastTime=time;
  const blend=reducedMotion.matches?1:1-Math.exp(-elapsed/85);
  cursorPosition.x+=(cursorTarget.x-cursorPosition.x)*blend;
  cursorPosition.y+=(cursorTarget.y-cursorPosition.y)*blend;
  placeBusinessCursor();
  const distance=Math.hypot(cursorTarget.x-cursorPosition.x,cursorTarget.y-cursorPosition.y);
  if(cursorExitAt){
    const box=cursorCard?.getBoundingClientRect();
    const outside=box?Math.hypot(Math.max(box.left-cursorTarget.x,0,cursorTarget.x-box.right),Math.max(box.top-cursorTarget.y,0,cursorTarget.y-box.bottom)):Infinity;
    if(distance<=6||time-cursorExitAt>=200||outside>100){finishCursorExit();cursorLastTime=0;return;}
  }
  if(distance>.1||cursorExitAt)cursorFrame=requestAnimationFrame(tickBusinessCursor);else cursorLastTime=0;
}
function queueBusinessCursor(){if(!cursorFrame)cursorFrame=requestAnimationFrame(tickBusinessCursor);}
function showBusinessCursor(event){
  if(!finePointer.matches||event.pointerType!=='mouse')return;
  clearTimeout(cursorHideTimer);cursorExitAt=0;
  cursorTarget={x:event.clientX,y:event.clientY};
  if(!cursorCard&&!businessCursor.classList.contains('is-leaving')){cursorPosition={...cursorTarget};placeBusinessCursor();}
  cursorCard=event.currentTarget;
  businessCursor.classList.remove('is-exiting','is-leaving');businessCursor.classList.add('is-visible');
  queueBusinessCursor();
}
function leaveBusinessCursor(event){
  if(!cursorCard)return;
  cursorTarget={x:event.clientX,y:event.clientY};cursorExitAt=performance.now();
  businessCursor.classList.add('is-exiting');queueBusinessCursor();
}
function resetBusinessCursor(){
  clearTimeout(cursorHideTimer);cancelAnimationFrame(cursorFrame);cursorFrame=0;cursorLastTime=0;cursorExitAt=0;cursorCard=null;
  businessCursor.classList.remove('is-visible','is-exiting','is-leaving');
}
document.addEventListener('pointermove',event=>{
  if(event.pointerType!=='mouse')return;
  cursorTarget={x:event.clientX,y:event.clientY};
  if(cursorCard||cursorExitAt)queueBusinessCursor();
},{passive:true});
document.querySelectorAll('#businesses .editorial-card').forEach(card=>{
  card.addEventListener('pointerenter',showBusinessCursor);
  card.addEventListener('pointermove',showBusinessCursor);
  card.addEventListener('pointerleave',leaveBusinessCursor);
  card.addEventListener('click',resetBusinessCursor);
});
addEventListener('scroll',resetBusinessCursor,{passive:true});
addEventListener('blur',resetBusinessCursor);
finePointer.addEventListener('change',resetBusinessCursor);

// Reward icons are a static decorative pattern in the EmCan panel.

// Scroll-linked heritage progress and image crossfades; native scrolling stays untouched.
(()=>{
 const section=document.querySelector('#heritage');
 if(!section)return;
 const items=[...section.querySelectorAll('.heritage-timeline li')];
 const figure=section.querySelector('.heritage-image');
 const firstImage=figure.querySelector('img');
 const sources=[
  [firstImage.getAttribute('src'),firstImage.alt],
  ['assets/heritage-evolution-attendant-polished-v1.png','Emarat service station attendant refuelling a vehicle'],
  ['assets/heritage-next-chapter-vr-supplied-v1.jpg','Woman using a virtual reality headset and controllers']
 ];
 const images=sources.map(([src,alt],index)=>{
  const img=index===0?firstImage:new Image();
  img.src=src;img.alt=alt;img.decoding='async';
  if(index)figure.append(img);
  img.classList.toggle('is-active',index===0);
  return img;
 });
 const track=document.createElement('div');track.className='heritage-scroll-track';
 section.before(track);track.append(section);
 const pinned=matchMedia('(min-width:1001px) and (min-height:760px) and (prefers-reduced-motion:no-preference)');
 let active=-1,frame=0;
 function show(index){
  if(index===active)return;
  active=index;
  items.forEach((item,i)=>{item.classList.toggle('is-active',i===index);item.classList.toggle('is-complete',i<index);item.setAttribute('aria-pressed',String(i===index));});
  images.forEach((img,i)=>img.classList.toggle('is-active',i===index));
 }
 function render(){
  frame=0;
  if(reducedMotion.matches)return;
  const box=track.getBoundingClientRect();
  const progress=pinned.matches?Math.max(0,Math.min(1,-box.top/(box.height-innerHeight))):Math.max(0,Math.min(1,(innerHeight*.65-box.top)/(box.height+innerHeight*.2)));
  const stage=progress*items.length;
  items.forEach((item,i)=>item.style.setProperty('--milestone-progress',String(Math.max(0,Math.min(1,stage-i)))));
  show(Math.min(items.length-1,Math.floor(stage)));
 }
 function queue(){if(!frame)frame=requestAnimationFrame(render);}
 items.forEach((item,i)=>{
  const bar=document.createElement('span');bar.className='heritage-progress';bar.setAttribute('aria-hidden','true');bar.append(document.createElement('span'));item.append(bar);
  item.tabIndex=0;item.setAttribute('role','button');
  item.setAttribute('aria-label',item.querySelector('h3').textContent+': show image');
  function select(){
   if(pinned.matches){scrollTo({top:scrollY+track.getBoundingClientRect().top+(track.offsetHeight-innerHeight)*(i+.45)/items.length,behavior:'smooth'});}
   else{show(i);items.forEach((entry,j)=>entry.style.setProperty('--milestone-progress',j<=i?'1':'0'));}
  }
  item.addEventListener('click',select);
  item.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();select();}});
 });
 show(0);render();
 addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue,{passive:true});
 reducedMotion.addEventListener('change',queue);
})();

// Business cards: native horizontal scrolling plus category and next-card controls.
(()=>{
 const rail=document.querySelector('.business-panels');if(!rail)return;
 const panels=[...rail.querySelectorAll('.business-panel')];
 const tabs=[...document.querySelectorAll('[data-business-index]')];
 let current=0,scheduled=false;
 function go(index){current=(index+panels.length)%panels.length;rail.scrollTo({left:panels[current].offsetLeft-panels[0].offsetLeft,behavior:reducedMotion.matches?'instant':'smooth'});}
 tabs.forEach((button,i)=>button.addEventListener('click',()=>go(i)));
 panels.forEach((panel,i)=>panel.querySelector('[data-business-next]').addEventListener('click',()=>go(i+1)));
 rail.addEventListener('scroll',()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;let nearest=0;panels.forEach((panel,i)=>{if(Math.abs(panel.offsetLeft-panels[0].offsetLeft-rail.scrollLeft)<Math.abs(panels[nearest].offsetLeft-panels[0].offsetLeft-rail.scrollLeft))nearest=i;});current=nearest;tabs.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===current)));});},{passive:true});
 rail.addEventListener('keydown',event=>{if(event.target!==rail)return;if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();go(current+(event.key==='ArrowRight'?1:-1));}});
})();

// Hover either half of the business rail to choose previous or next.
(()=>{
 const rail=document.querySelector('.business-panels');if(!rail)return;
 const panels=[...rail.querySelectorAll('.business-panel')];
 const pointer=matchMedia('(hover:hover) and (pointer:fine)');
 const cursor=document.createElement('span');cursor.className='business-direction-cursor';cursor.setAttribute('aria-hidden','true');
 cursor.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
 document.body.append(cursor);
 function hide(){cursor.classList.remove('is-visible');}
 function direction(x){const box=rail.getBoundingClientRect();return x<box.left+box.width/2?-1:1;}
 rail.addEventListener('pointermove',event=>{
  if(!pointer.matches||event.pointerType!=='mouse'||event.target.closest('button,a')){hide();return;}
  cursor.style.transform='translate3d('+(event.clientX-22)+'px,'+(event.clientY-22)+'px,0)';
  cursor.classList.toggle('is-left',direction(event.clientX)<0);cursor.classList.add('is-visible');
 });
 rail.addEventListener('pointerleave',hide);
 rail.addEventListener('click',event=>{
  if(!pointer.matches||event.target.closest('button,a')||event.detail===0)return;
  if(getSelection()?.toString())return;
  const first=panels[0].offsetLeft;
  let nearest=0;
  panels.forEach((panel,i)=>{if(Math.abs(panel.offsetLeft-first-rail.scrollLeft)<Math.abs(panels[nearest].offsetLeft-first-rail.scrollLeft))nearest=i;});
  const next=Math.max(0,Math.min(panels.length-1,nearest+direction(event.clientX)));
  rail.scrollTo({left:panels[next].offsetLeft-first,behavior:reducedMotion.matches?'instant':'smooth'});
 });
 addEventListener('scroll',hide,{passive:true});addEventListener('blur',hide);pointer.addEventListener('change',hide);
})();

// Sustainability stories: manual previous/next controls with a quiet text fade.
(()=>{
 const content=document.querySelector('.sustainability-story-content');if(!content)return;
 const images=[...document.querySelectorAll('.sustainability-banner-media img')];
 const stories=[
  ['Making resources go further.','Finding practical ways to use energy and water more efficiently across our operations.','Responsible operations'],
  ['Looking after what matters.','Working with our teams and partners to reduce our impact and care for the places we call home.','Environmental care'],
  ['Putting people first.','Building a culture where safety, wellbeing and shared responsibility are part of every working day.','Health & safety']
 ];
 let index=0,timer=0;
 function change(step){
  index=(index+step+stories.length)%stories.length;clearTimeout(timer);
  function update(){const [title,description,label]=stories[index];content.querySelector('h3').textContent=title;content.querySelector('p').textContent=description;document.querySelector('.sustainability-link-label').textContent=label;images.forEach((image,i)=>image.classList.toggle('is-active',i===index));content.classList.remove('is-changing');}
  if(reducedMotion.matches){update();return;}
  content.classList.add('is-changing');timer=setTimeout(update,180);
 }
 document.querySelector('[data-sustainability-prev]').addEventListener('click',()=>change(-1));
 document.querySelector('[data-sustainability-next]').addEventListener('click',()=>change(1));
})();
