/* Approved photographs remain immutable. Effects sample only their existing pixels. */
(() => {
  'use strict';
  const motionQuery = '(prefers-reduced-motion: reduce)';
  let reduce = matchMedia(motionQuery);
  let paused = storage.get('bkbk-motion', 'on') === 'off';
  const motionButton = document.querySelector('#motion');
  function motionState() {
    reduce = matchMedia(motionQuery);
    const stopped = paused || reduce.matches;
    document.body.classList.toggle('motion-paused', stopped);
    motionButton.textContent = t(stopped ? 'resumeMotion' : 'pauseMotion');
    motionButton.setAttribute('aria-pressed', String(stopped));
    motionButton.disabled = reduce.matches;
    scenes.forEach(scene => stopped ? scene.stop() : scene.start());
  }
  motionButton.onclick = () => { paused = !paused; storage.set('bkbk-motion', paused ? 'off' : 'on'); motionState(); };
  const scenes = [];
  // Source-space masks: [polygon, movement type]. The camera and architectural pixels never move.
  const masks = {
    day: [
      [[[650,526],[1020,527],[1140,565],[1145,671],[739,675]],'water'],
      [[[847,693],[1146,693],[1147,755],[920,762],[887,737]],'water'],
      [[[295,22],[654,24],[578,195],[493,354],[372,457],[279,481],[418,351],[503,189]],'curtain'],
      [[[1261,155],[1352,170],[1325,364],[1246,426],[1194,351]],'leaves']
    ],
    night: [
      [[[785,577],[1310,577],[1268,666],[912,670],[817,648]],'water'],
      [[[914,693],[1250,693],[1267,744],[896,744]],'water'],
      [[[435,19],[682,19],[652,172],[584,337],[502,414],[463,408],[543,255]],'curtain'],
      [[[1246,277],[1367,212],[1469,267],[1465,371],[1379,334]],'leaves']
    ],
    dayMobile: [
      [[[457,779],[660,779],[769,813],[728,910],[477,910]],'water'],
      [[[575,940],[806,940],[805,1008],[589,1008]],'water'],
      [[[332,50],[550,50],[467,295],[365,499],[200,628],[252,532],[375,309]],'curtain']
    ],
    nightMobile: [
      [[[675,814],[1000,814],[1000,927],[719,927]],'water'],
      [[[720,962],[875,962],[875,1035],[720,1035]],'water'],
      [[[256,12],[350,12],[300,215],[226,429],[185,493],[199,365]],'curtain']
    ],
    studioDay: [
      [[[668,481],[751,481],[795,511],[902,516],[863,594],[690,607]],'water'],
      [[[704,628],[886,628],[890,702],[714,703]],'water'],
      [[[476,20],[624,20],[564,174],[487,308],[420,351],[465,233]],'curtain']
    ],
    studioNight: [
      [[[948,453],[1402,453],[1395,534],[1017,543]],'water'],
      [[[1090,616],[1238,616],[1200,683],[1098,684]],'water'],
      [[[474,4],[719,5],[648,162],[569,278],[497,301],[536,172]],'curtain']
    ]
  };
  class Scene {
    constructor(container, images, types) {
      this.container=container;this.images=images;this.types=types;this.visible=false;this.raf=0;this.last=0;
      this.canvas=document.createElement('canvas');this.canvas.className='living-layer';this.canvas.setAttribute('aria-hidden','true');container.append(this.canvas);
      this.ctx=this.canvas.getContext('2d');this.patch=document.createElement('canvas');this.pctx=this.patch.getContext('2d');
      this.layer=document.createElement('canvas');this.lctx=this.layer.getContext('2d');
      new ResizeObserver(()=>this.resize()).observe(container);
      this.observer=new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;this.visible?this.start():this.stop()});this.observer.observe(container);
      images.forEach(im=>{im.addEventListener('load',()=>this.resize());});this.resize();
    }
    image(){return this.images.length===1?this.images[0]:this.images[mode==='night'?1:0]}
    type(){let type=this.types.length===1?this.types[0]:this.types[mode==='night'?1:0];if((type==='day'||type==='night')&&this.image().naturalHeight>this.image().naturalWidth)type+='Mobile';return type}
    resize(){
      const r=this.container.getBoundingClientRect();this.ratio=Math.min(devicePixelRatio||1,1.35);
      this.canvas.width=Math.round(r.width*this.ratio);this.canvas.height=Math.round(r.height*this.ratio);
      const im=this.image();if(!im.naturalWidth)return;
      this.scale=Math.max(this.canvas.width/im.naturalWidth,this.canvas.height/im.naturalHeight);
      this.ox=(this.canvas.width-im.naturalWidth*this.scale)/2;this.oy=(this.canvas.height-im.naturalHeight*this.scale)/2;
      this.patch.width=im.naturalWidth;this.patch.height=im.naturalHeight;this.layer.width=im.naturalWidth;this.layer.height=im.naturalHeight;
      this.regions=(masks[this.type()]||[]).map(([points,type])=>{
        const mask=document.createElement('canvas');mask.width=im.naturalWidth;mask.height=im.naturalHeight;const c=mask.getContext('2d');c.filter='blur(5px)';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();return {mask,type,top:Math.min(...points.map(p=>p[1])),bottom:Math.max(...points.map(p=>p[1]))};
      });this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    }
    stop(){cancelAnimationFrame(this.raf);this.raf=0;this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height)}
    start(){if(this.raf||!this.visible||this.transitioning||paused||reduce.matches||document.hidden)return;this.raf=requestAnimationFrame(time=>this.draw(time))}
    draw(time){
      this.raf=0;if(!this.visible||paused||reduce.matches||document.hidden)return;
      if(time-this.last<66){this.start();return}this.last=time;const im=this.image();if(!im.complete||!im.naturalWidth){this.start();return}
      const c=this.ctx; c.clearRect(0,0,this.canvas.width,this.canvas.height);
      for(const region of this.regions||[]){
        const pc=this.pctx;pc.clearRect(0,0,this.patch.width,this.patch.height);
        if(region.type==='water'){
          for(let y=region.top;y<region.bottom;y+=3){const dx=Math.sin(y*.12+time*.00065)*2.1+Math.sin(y*.045-time*.00032)*.9;pc.drawImage(im,0,y,im.naturalWidth,3,dx,y,im.naturalWidth,3)}
        }else{
          const amp=region.type==='curtain'?3.4:1.6;
          for(let y=region.top;y<region.bottom;y+=4){
            const depth=(y-region.top)/Math.max(1,region.bottom-region.top);
            const dx=(Math.sin(time*.00048-depth*1.8)+.35*Math.sin(time*.00021+depth))*amp*depth;
            pc.drawImage(im,0,y,im.naturalWidth,4,dx,y,im.naturalWidth,4);
          }
        }
        pc.globalCompositeOperation='destination-in';pc.drawImage(region.mask,0,0);pc.globalCompositeOperation='source-over';
        c.drawImage(this.patch,this.ox,this.oy,this.patch.width*this.scale,this.patch.height*this.scale);
      }
      this.start();
    }
  }
  const hero=document.querySelector('.scene');scenes.push(new Scene(hero,[hero.querySelector('.day'),hero.querySelector('.night')],['day','night']));
  const about=document.querySelector('.portrait-scene');scenes.push(new Scene(about,[about.querySelector('img'),about.querySelector('.night')],['studioDay','studioNight']));
  const film=document.querySelector('.film');scenes.push(new Scene(film,[film.querySelector('img')],['night']));
  // Source-aligned light pools, not new objects or flames.
  const lights = document.createElement('div');lights.className='scene-lights';lights.setAttribute('aria-hidden','true');hero.append(lights);
  function setLights(){
    const im=hero.querySelector(mode==='night'?'.night':'.day'),r=hero.getBoundingClientRect();if(!im.naturalWidth)return;
    const scale=Math.max(r.width/im.naturalWidth,r.height/im.naturalHeight),x0=(r.width-im.naturalWidth*scale)/2,y0=(r.height-im.naturalHeight*scale)/2;
    const mobile=im.naturalHeight>im.naturalWidth;const points=mobile?(mode==='night'?[[46,396,32],[298,903,28],[510,869,20],[795,300,54]]:[[133,1080,26],[254,841,24],[18,485,25]]):mode==='night'?[[205,689,32],[178,194,36],[562,532,25],[1383,538,25],[1422,699,29],[1233,103,62]]:[[239,771,26],[1276,710,25],[800,444,80],[800,571,50]];
    lights.replaceChildren();for(const [x,y,size] of points){const s=document.createElement('span');s.style.cssText=`left:${x0+x*scale}px;top:${y0+y*scale}px;width:${size*scale}px;height:${size*scale}px;animation-delay:-${x/300}s`;lights.append(s)}
  }
  new ResizeObserver(setLights).observe(hero);hero.querySelectorAll('img').forEach(im=>im.addEventListener('load',setLights));
  // Fine-pointer native cursor maintains the exact hotspot; the ring is decorative only.
  if(matchMedia('(hover:hover) and (pointer:fine)').matches){
    const ring=document.createElement('span');ring.className='cursor-ring';document.body.append(ring);
    document.addEventListener('pointermove',e=>{ring.style.left=e.clientX+'px';ring.style.top=e.clientY+'px';ring.classList.toggle('over',!!e.target.closest('a,button'))},{passive:true});
    document.addEventListener('pointerdown',()=>{ring.classList.remove('tap');void ring.offsetWidth;ring.classList.add('tap')},{passive:true});
  }
  // These are the exact URLs already present in the owner's original repository.
  const channels=[['Instagram','https://www.instagram.com/bkbkstudios/','<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".7"/>'],['TikTok','https://www.tiktok.com/@bkbk.studios','<path d="M14 3v12a4 4 0 1 1-4-4M14 3c1 4 3 5 6 5"/>'],['YouTube','https://youtube.com/@bkbkstudios','<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>']];
  for(const box of document.querySelectorAll('.social-links'))box.innerHTML=channels.map(([label,url,shape])=>`<a href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${label}"><svg viewBox="0 0 24 24" aria-hidden="true">${shape}</svg><span>${label}</span></a>`).join('');
  document.addEventListener('bkbk:mode',()=>{scenes.forEach(s=>{s.stop();s.resize();s.transitioning=true;clearTimeout(s.transitionTimer);s.transitionTimer=setTimeout(()=>{s.transitioning=false;s.start()},1250)});setLights()});
  document.addEventListener('bkbk:language',()=>{motionState();document.querySelectorAll('.social-links').forEach(e=>e.setAttribute('aria-label',t('socialLabel')))});
  document.addEventListener('visibilitychange',()=>{scenes.forEach(s=>document.hidden?s.stop():s.start())});
  const mediaWatcher=matchMedia(motionQuery);
  mediaWatcher.addEventListener('change',motionState);
  // A low-frequency fallback also catches restored-page media changes in older WebKit/Chromium.
  let previousReduced=mediaWatcher.matches;
  setInterval(()=>{if(document.hidden)return;const current=matchMedia(motionQuery).matches;if(current!==previousReduced){previousReduced=current;motionState()}},750);
  window.addEventListener('pageshow',motionState);motionState();setLights();
})();
