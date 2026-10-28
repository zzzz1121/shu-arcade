var platformTool=null,platformVersion=0,savedProgress=null,storageQueue=Promise.resolve();
async function initPlatform(){
 var x=window.xhs,tool=x&&x.miniTool,options=x&&x.launchOptions;
 if(tool&&(!options||!options.miniToolEnv)&&typeof tool.getLaunchOptions==='function'){try{options=await tool.getLaunchOptions()}catch(error){}}
 platformVersion=Math.floor(Number(options&&options.miniToolEnv&&options.miniToolEnv.buildVersion||0)/1000);
 if(platformVersion>=9460&&tool&&typeof tool.getStorage==='function'&&typeof tool.setStorage==='function')platformTool=tool;
 try{if(platformTool){var data=await platformTool.getStorage({key:saveKey});savedProgress=data&&data.data;if(!savedProgress){try{savedProgress=localStorage.getItem(saveKey)}catch(error){}}}else savedProgress=localStorage.getItem(saveKey)}catch(error){storageAvailable=false}
 await updateWindow();
}
function writeProgress(value){savedProgress=value;if(platformTool){storageQueue=storageQueue.then(async function(){try{await platformTool.setStorage({key:saveKey,data:value});storageAvailable=true}catch(error){storageAvailable=false;$('tip').textContent='进度保存失败，本局仍可继续'}})}else{localStorage.setItem(saveKey,value)}}
function lastMatch(items,type){for(var i=items.length-1;i>=0;i--)if(items[i].type===type)return i;return -1}
function haptic(){var t=window.xhs&&window.xhs.miniTool;if(platformVersion>=9500&&t&&typeof t.vibrateShort==='function'){try{var r=t.vibrateShort({type:'light'});if(r&&r.catch)r.catch(function(){})}catch(error){}}}
async function updateWindow(){var root=document.documentElement;root.style.setProperty('--slot-height',Math.max(20,(Math.min(innerWidth,460)-88)/7)+'px');root.style.setProperty('--app-height',window.innerHeight+'px');root.style.setProperty('--native-buttons-bottom',window.xhs?(Math.max(48,88-(parseFloat(getComputedStyle(root).getPropertyValue('--safe-area-inset-top'))||0))+'px'):'0px');var t=window.xhs&&window.xhs.miniTool;if(t&&typeof t.getWindowInfo==='function'){try{var w=await t.getWindowInfo();if(w.windowHeight)root.style.setProperty('--app-height',w.windowHeight+'px');var a=w.safeArea;if(a){root.style.setProperty('--safe-area-inset-top',Math.max(0,a.top)+'px');root.style.setProperty('--safe-area-inset-bottom',Math.max(0,w.windowHeight-a.bottom)+'px')}var buttons=w.menuButtons||{},bottom=0;Object.keys(buttons).forEach(function(k){if(buttons[k]&&buttons[k].top<Math.max(120,w.windowHeight*.2))bottom=Math.max(bottom,buttons[k].bottom)});root.style.setProperty('--native-buttons-bottom',Math.max(0,bottom-(a?a.top:0))+'px')}catch(error){}}}
window.addEventListener('resize',updateWindow);
if(!Element.prototype.replaceChildren)Element.prototype.replaceChildren=function(){while(this.firstChild)this.removeChild(this.firstChild);for(var i=0;i<arguments.length;i++)this.appendChild(arguments[i])};
document.querySelectorAll('dialog').forEach(function(d){if(!d.showModal){d.showModal=function(){this.setAttribute('open','');this.classList.add('dialog-fallback')};d.close=function(){this.removeAttribute('open');this.classList.remove('dialog-fallback')}}});

