const $=id=>document.getElementById(id),names=['铁钱','茶叶','粮袋','药材','纸墨','青布','交子','货栈'];let tiles=[],tray=[],reserve=[],history=[],used={},level=1,total=0,ended=false;const icons=[];
function mix(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
async function load(){await initPlatform();for(let k=0;k<8;k++)icons.push('assets/'+(k===0?'iron':k===5?'cloth':k===6?'note':k===7?'warehouse':'item-'+k)+'-tile.png');if(!restoreGame())start()}
const stages=[
 ['初入蜀地',5,2,4,6],['百物归仓',6,3,6,6],['茶马古道',6,3,7,7],['锦官夜市',6,4,8,7],['山城叠影',7,4,8,7],['雨巷寻珍',7,5,8,7],['蜀道重重',7,5,8,7],['千帆竞渡',8,5,8,7],['深巷藏珍',8,6,8,7],['重楼迷阵',8,7,8,7],['百货云集',8,8,8,7],['蜀地大掌柜',8,10,8,7]
];
function stage(){return stages[level-1]||stages[0]}
function layout(n){const positions=[];
if(n===1){for(let r=0;r<3;r++)for(let c=0;c<6;c++)positions.push({x:3+c*15,y:15+r*22,z:0,w:14,h:18,zone:'main'});return positions}
const layers=stages[n-1][2],depth=4+n;
for(let z=0;z<layers;z++)for(let r=0;r<5;r++)for(let c=0;c<5;c++){
 if(z%2===1&&(r===0||r===4)&&(c===0||c===4))continue;
 if(n>=5&&z%3===2&&c===2&&r===2)continue;
 positions.push({x:17+c*12.5+(z%2)*3,y:5+r*13+(z%2)*3,z,w:11.7,h:11.8,zone:'main'});
}
for(let side=0;side<2;side++)for(let z=0;z<depth;z++)positions.push({x:side?86:2,y:7+z*.65,z,w:11,h:12,zone:'blind'});
for(let c=0;c<6;c++)for(let z=0;z<(n>=6?2:1);z++)positions.push({x:5+c*15,y:79+z*2,z,w:13,h:12,zone:'side'});
while(positions.length%3)positions.pop();return positions}
function overlaps(a,b){return a.x<b.x+(b.w||14)&&a.x+(a.w||14)>b.x&&a.y<b.y+(b.h||17)&&a.y+(a.h||17)>b.y}
let solution=[];
function deal(positions,kinds){
 const result=positions.map((p,id)=>Object.assign({},p,{id,type:0})),remaining=new Set(result.map(t=>t.id)),path=[];
 const blockers=result.map(t=>result.filter(o=>o.z>t.z&&overlaps(o,t)).map(o=>o.id));
 while(remaining.size){const open=result.filter(t=>remaining.has(t.id)&&blockers[t.id].every(id=>!remaining.has(id)));if(!open.length)throw Error('Invalid layout');
 const mains=open.filter(t=>t.zone==='main'),pool=mains.length&&Math.random()<.78?mains:open,t=pool[Math.floor(Math.random()*pool.length)];path.push(t.id);remaining.delete(t.id)}
 const supply=Array(kinds).fill(0),held=Array(kinds).fill(0);for(let i=0;i<result.length/3;i++)supply[i%kinds]+=3;
 const activeLimit=level===1?1:level<5?2:3;
 for(const id of path){const active=held.filter(Boolean).length;let candidates=supply.map((n,k)=>k).filter(k=>supply[k]>0&&(held[k]>0||active<activeLimit));const type=candidates[Math.floor(Math.random()*candidates.length)];result[id].type=type;supply[type]--;held[type]=(held[type]+1)%3}
 solution=path;return result;
}
function start(){tray=[];reserve=[];history=[];used={undo:0,shuffle:0,move:0};ended=false;tiles=deal(layout(level),stage()[3]);total=tiles.length;$('tip').textContent=level===1?'先试试三个相同物件消除':'挖开主牌堆，侧边明牌留作备用';render()}
function blocked(t){return tiles.some(o=>o.z>t.z&&o.x<t.x+(t.w||14)&&o.x+(o.w||14)>t.x&&o.y<t.y+(t.h||17)&&o.y+(o.h||17)>t.y)}
function button(t,fn){let b=document.createElement('button');b.className='tile';b.setAttribute('aria-label',names[t.type]);let im=new Image();im.src=icons[t.type];im.srcset=[64,96,128,192,256].map(n=>icons[t.type].replace('.png','-'+n+'.png')+' '+n+'w').join(',');im.sizes=Math.ceil(Math.min(innerWidth,460)*.14)+'px';im.decoding='async';im.alt=names[t.type];b.append(im);b.onclick=fn;return b}
function snapshot(){history.push(JSON.stringify({tiles,tray,reserve}));if(history.length>30)history.shift()}
function pick(t,fromReserve=false){if(ended||(!fromReserve&&blocked(t)))return;snapshot();if(fromReserve)reserve=reserve.filter(o=>o.id!==t.id);else tiles=tiles.filter(o=>o.id!==t.id);let at=lastMatch(tray,t.type);tray.splice(at<0?tray.length:at+1,0,t);let matches=tray.filter(o=>o.type===t.type);if(matches.length===3){tray=tray.filter(o=>o.type!==t.type);$('tip').textContent=names[t.type]+' × 3，消除！';haptic()}else $('tip').textContent='优先收集暂存槽里已有的物件';render();if(tray.length>=7)finish(false);else if(!tiles.length&&!tray.length&&!reserve.length)finish(true)}
function render(){saveGame();$('board').replaceChildren();for(let t of tiles){let b=button(t,e=>animatePick(t,false,e.currentTarget));b.style.left=t.x+'%';b.style.top=t.y+'%';b.style.zIndex=t.z+1;b.style.height=(t.h||17)+'%';b.style.width=(t.w||14)+'%';b.disabled=blocked(t);b.dataset.zone=t.zone||'main';$('board').append(b)}$('tray').replaceChildren();for(let i=0;i<7;i++){let slot=document.createElement('div');if(tray[i]){let b=button(tray[i],()=>{});b.tabIndex=-1;slot.append(b)}$('tray').append(slot)}$('reserve').replaceChildren(...reserve.map(t=>button(t,e=>animatePick(t,true,e.currentTarget))));$('count').textContent=tray.length+' / 7';$('level').textContent='第 '+level+' 关 · '+stage()[0];let n=total-tiles.length-tray.length-reserve.length;$('progress').textContent='已消除 '+n+' / '+total;$('meter').style.width=n/total*100+'%';for(let id of ['undo','shuffle','move']){$(id).disabled=ended||used[id]>=1||(id==='undo'&&!history.length)||(id==='move'&&(!tray.length||reserve.length>0));$(id).querySelector('small').textContent='剩余 '+(1-used[id])+' 次'}}
function finish(win){ended=true;if(win){completed=Array.from(new Set([...completed,level]));unlocked=Math.max(unlocked,Math.min(stages.length,level+1))}render();$('result').textContent=win?'满仓皆欢喜':'行囊装满啦';$('detail').textContent=win?(level<stages.length?'下一关有更多叠牌，准备好继续了吗？':'十二关全部完成，你就是蜀地大掌柜！'):'试试先消除已有的物件，给行囊留点余地。';$('again').textContent=win&&level<stages.length?'挑战下一关':'再来一局';$('again').onclick=()=>{$('modal');document.querySelector('dialog').close();if(win&&level<stages.length)level++;start()};document.querySelector('dialog').showModal()}
$('restart').onclick=()=>{start()};$('undo').onclick=()=>{if(!history.length||used.undo)return;let s=JSON.parse(history.pop());tiles=s.tiles;tray=s.tray;reserve=s.reserve;used.undo++;render()};$('shuffle').onclick=()=>{if(used.shuffle)return;let types=mix(tiles.map(t=>t.type));tiles.forEach((t,i)=>t.type=types[i]);used.shuffle++;history=[];render()};$('move').onclick=()=>{if(used.move||reserve.length||!tray.length)return;reserve=tray.splice(0,3);used.move++;history=[];render()};Promise.resolve().then(load).catch(()=>{$('tip').textContent='素材加载失败，请检查 assets 文件夹是否完整。'});


let busy=false,audioCtx,musicTimer,musicOn=false,sfxOn=true,musicStep=0;
function context(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx}
function tone(freq,duration=.2,volume=.05,delay=0,kind='sine'){try{const c=context(),t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=kind;o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+duration)}catch(error){}}
function sound(match=false){if(!sfxOn)return;if(match)[523.25,659.25,783.99,1046.5].forEach((n,i)=>tone(n,.32,.045,i*.065));else{tone(740,.09,.035);tone(1110,.13,.018,.035)}}
function musicTick(){if(document.hidden||!musicOn)return;const notes=[60,64,67,69,67,64,62,64,60,55,60,64,62,59,55,59,57,60,64,67,64,60,57,60,55,59,62,64,62,59,55,0];const n=notes[musicStep%notes.length];if(n)tone(440*2**((n-69)/12),1.1,.024);if(musicStep%4===0)tone(440*2**(([48,43,45,43][Math.floor(musicStep/8)%4]-69)/12),1.8,.014);musicStep++}
$('audio').onclick=()=>{musicOn=!musicOn;$('audio').textContent=musicOn?'♫ 音乐开':'♫ 音乐关';$('audio').setAttribute('aria-pressed',musicOn);clearInterval(musicTimer);if(musicOn){context();musicTick();musicTimer=setInterval(musicTick,420)}};
$('sfx').onclick=()=>{sfxOn=!sfxOn;$('sfx').textContent=sfxOn?'音效开':'音效关';$('sfx').setAttribute('aria-pressed',sfxOn);if(sfxOn)sound()};
document.addEventListener('visibilitychange',()=>{if(audioCtx){if(document.hidden)audioCtx.suspend();else if(musicOn)audioCtx.resume()}});
function burst(rect){if(!Element.prototype.animate)return;for(let i=0;i<14;i++){let p=document.createElement('i');p.className='spark';p.style.left=rect.x+rect.width/2+'px';p.style.top=rect.y+rect.height/2+'px';p.style.background=i%2?'#e2b359':'#f8f2d6';document.body.append(p);p.animate([{transform:'translate(0,0) rotate(0)',opacity:1},{transform:`translate(${(Math.random()-.5)*150}px,${(Math.random()-.65)*130}px) rotate(200deg)`,opacity:0}],{duration:650,easing:'ease-out'});setTimeout(()=>p.remove(),700)}}
async function animatePick(t,fromReserve,el){if(busy||ended)return;busy=true;try{const matching=tray.filter(o=>o.type===t.type).length===2,rect=el.getBoundingClientRect(),target=$('tray').children[Math.min(tray.length,6)].getBoundingClientRect();sound();if(el.animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const ghost=el.cloneNode(true);ghost.classList.add('flying');Object.assign(ghost.style,{left:rect.x+'px',top:rect.y+'px',width:rect.width+'px',height:rect.height+'px'});document.body.append(ghost);el.style.visibility='hidden';const flight=ghost.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${target.x-rect.x}px,${target.y-rect.y}px) scale(.85)`}],{duration:240,easing:'cubic-bezier(.3,.1,.4,1)'});await Promise.race([(flight.finished?flight.finished.catch(()=>{}):new Promise(resolve=>setTimeout(resolve,240))),new Promise(resolve=>setTimeout(resolve,300))]);flight.cancel();ghost.remove()}pick(t,fromReserve);if(matching){sound(true);$('tray').classList.remove('celebrate');void $('tray').offsetWidth;$('tray').classList.add('celebrate');if(!matchMedia('(prefers-reduced-motion: reduce)').matches)burst($('tray').getBoundingClientRect())}else{$('tray').querySelectorAll('.tile').forEach(b=>b.classList.add('pop'))}}finally{busy=false}}
for(const id of ['undo','shuffle','move','restart']){const action=$(id).onclick;$(id).onclick=()=>{if(busy)return;sound();action();if(id==='shuffle'&&$('board').animate){$('board').animate([{opacity:.35,transform:'scale(.96)'},{opacity:1,transform:'scale(1)'}],{duration:320})}}}





const saveKey='shu-match-progress-v1';let unlocked=1,completed=[],storageAvailable=true;
function saveGame(){try{writeProgress(JSON.stringify({version:1,unlocked,completed,game:{level,total,tiles,tray,reserve,history,used,ended}}));storageAvailable=true}catch(error){storageAvailable=false}}
function restoreGame(){try{const data=JSON.parse(savedProgress||'null');if(!data||data.version!==1)return false;unlocked=Math.max(1,Math.min(stages.length,Number(data.unlocked)||1));completed=Array.isArray(data.completed)?data.completed.filter(n=>Number.isInteger(n)&&n>=1&&n<=stages.length):[];const g=data.game;if(!g||(!Number.isInteger(g.level)||g.level<1||g.level>stages.length)||!Array.isArray(g.tiles)||!Array.isArray(g.tray)||!Array.isArray(g.reserve))return false;level=g.level;if(g.ended){start();return true}if(![...g.tiles,...g.tray,...g.reserve].every(t=>Number.isInteger(t.id)&&Number.isInteger(t.type)&&t.type>=0&&t.type<8))return false;({total,tiles,tray,reserve,history,used}=g);history=Array.isArray(history)?history:[];used=used||{undo:0,shuffle:0,move:0};ended=false;render();$('tip').textContent='已恢复上次牌局';return true}catch(error){return false}}
$('choose').onclick=()=>{if(busy)return;$('level-list').replaceChildren();for(let n=1;n<=stages.length;n++){const b=document.createElement('button');b.className='level-option';b.disabled=n>unlocked;b.textContent=('第 '+n+' 关 · '+stages[n-1][0]+'\n'+layout(n).length+' 张 / '+stages[n-1][2]+' 层')+'　'+(n>unlocked?'未解锁':completed.includes(n)?'已通关':n===level?'进行中':'可挑战');b.onclick=()=>{$('levels').close();if(n!==level||ended){level=n;start()}};$('level-list').append(b)}$('save-status').textContent=storageAvailable?'进度自动保存在本机浏览器':'浏览器暂时无法保存，请勿关闭当前页面';$('levels').showModal()};
$('close-levels').onclick=()=>$('levels').close();$('clear-progress').onclick=()=>$('clear-confirm').showModal();$('cancel-clear').onclick=()=>$('clear-confirm').close();$('confirm-clear').onclick=()=>{unlocked=1;completed=[];level=1;document.querySelectorAll('dialog[open]').forEach(d=>d.close());start();$('tip').textContent='进度已清除，从第一关重新出发'};

