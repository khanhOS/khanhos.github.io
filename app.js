/* khanhOS — app.js · toàn bộ logic */
window.onerror=function(m,s,l){var d=document.getElementById('jserr')||document.createElement('div');d.id='jserr';d.style.cssText='position:fixed;bottom:0;left:0;right:0;background:#E06D4D;color:#fff;padding:8px;font:12px monospace;z-index:9999';d.textContent='Lỗi: '+m+' (dòng '+l+')';document.body.appendChild(d);return false};

var OWNER='hoangbaokhanhhehe@gmail.com';
function $(s){return document.querySelector(s)}
function $$(s){return [].slice.call(document.querySelectorAll(s))}
var API='https://api.cerebras.ai/v1/chat/completions',APIM='https://api.cerebras.ai/v1/models';
var KU='kos_u6',KS='kos_s6',KD=function(e){return 'kos_d6_'+e};
var REM=/^[^\s@]+@[^\s@]+\.[^\s@]+$/,RPH=/^0\d{9,10}$/;
var store={g:function(k){try{return localStorage.getItem(k)}catch(e){return null}},s:function(k,v){try{localStorage.setItem(k,v)}catch(e){}},d:function(k){try{localStorage.removeItem(k)}catch(e){}}};
var PLANS={
 free:{n:'FREE',tok:10000,mt:2048,vnd:0,pr:'0₫',feats:['10.000 token/ngày','Llama 3.1 8B']},
 plus:{n:'PLUS',tok:100000,mt:4096,vnd:99000,pr:'99.000₫/tháng',feats:['100.000 token/ngày','Llama 3.3 70B · Scout · Qwen 3 32B']},
 max:{n:'MAX',tok:500000,mt:8192,vnd:299000,pr:'299.000₫/tháng',feats:['500.000 token/ngày','GPT-OSS 120B · Qwen 3 235B','System prompt riêng']}};
var RANK={free:0,plus:1,max:2},HIST={free:8,plus:20,max:40};
var MODELS=[
 {id:'llama3.1-8b',l:'Llama 3.1 8B',p:'free'},
 {id:'llama-3.3-70b',l:'Llama 3.3 70B',p:'plus'},
 {id:'llama-4-scout-17b-16e-instruct',l:'Llama 4 Scout',p:'plus'},
 {id:'qwen-3-32b',l:'Qwen 3 32B',p:'plus'},
 {id:'gpt-oss-120b',l:'GPT-OSS 120B',p:'max'},
 {id:'qwen-3-235b-a22b-instruct-2507',l:'Qwen 3 235B',p:'max'}];
var APPS=[{id:'momo',n:'MoMo',b:'M',c:'#A50064'},{id:'zalo',n:'ZaloPay',b:'Z',c:'#0B63CE'},{id:'vnpay',n:'VNPay',b:'V',c:'#123D8C'},{id:'shop',n:'ShopeePay',b:'S',c:'#EE4D2D'},{id:'napas',n:'Napas',b:'N',c:'#41506B'}];
var SYS='Bạn là khanhOS Assistant, trợ lý AI trên hạ tầng Cerebras. Trả lời chính xác, súc tích, bằng ngôn ngữ người dùng đang dùng. Viết code thì dùng markdown code block kèm tên ngôn ngữ.';

function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function today(){return new Date().toLocaleDateString('sv')}
function fT(n){return n>=1000?((n/1000).toFixed(1).replace('.0','')+'k'):String(n)}
function fV(n){return n.toLocaleString('vi-VN')+'₫'}
function ago(t){var s=(Date.now()-t)/1e3;return s<60?'vừa xong':s<3600?Math.floor(s/60)+'p':s<86400?Math.floor(s/3600)+'h':Math.floor(s/86400)+'d'}
function hash(s){return new Promise(function(res){try{crypto.subtle.digest('SHA-256',new TextEncoder().encode('k:'+s)).then(function(b){var a=new Uint8Array(b),r='';for(var i=0;i<a.length;i++)r+=a[i].toString(16).padStart(2,'0');res(r)})}catch(e){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}res('f'+h)}})}
function otp(){return String(Math.floor(1e5+Math.random()*9e5))}
function toast(m,c){var d=document.createElement('div');d.className='tt '+(c||'info');d.textContent=m;$('#ts').appendChild(d);setTimeout(function(){d.remove()},3000)}
function inl(s){return s.replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>')}
function md(t){
 t=String(t==null?'':t);
 var parts=t.split('```'),o='';
 for(var i=0;i<parts.length;i++){
  if(i%2){
   var c=parts[i],lg='';
   var n=c.indexOf('\n');if(n>-1){var f=c.slice(0,n).trim();if(f&&/^[\w.+#-]+$/.test(f)){lg=f;c=c.slice(n+1)}}
   o+='<div class="cb"><div class="h"><span>'+esc(lg||'code')+'</span><button class="cp" type="button">Chép</button></div><pre><code>'+esc(c.replace(/\n$/,''))+'</code></pre></div>';
  }else{
   var ls=parts[i].split('\n'),out='',j=0;
   while(j<ls.length){
    if(!ls[j].trim()){j++;continue}
    if(/^[-*]\s/.test(ls[j])){var it=[];while(j<ls.length&&/^[-*]\s/.test(ls[j])){it.push(inl(esc(ls[j].slice(2))));j++}out+='<ul><li>'+it.join('</li><li>')+'</li></ul>';continue}
    var p=[];while(j<ls.length&&ls[j].trim()&&!/^[-*]\s/.test(ls[j])){p.push(esc(ls[j]));j++}
    out+='<p>'+inl(p.join('<br>'))+'</p>';
   }
   o+=out;
  }
 }
 return o;
}
function mO(h){$('#mp').innerHTML='<button class="x" id="mx" type="button">✕</button>'+h;$('#mp').onclick=null;$('#mo').hidden=false;$('#mx').onclick=mC}
function mC(){$('#mo').hidden=true;$('#mp').innerHTML=''}
 $('#mo').addEventListener('click',function(e){if(e.target.id==='mo')mC()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){if(!$('#mo').hidden)mC();else document.body.classList.remove('so')}});
function qr(cv,seed){
 var n=21,cl=9,p=2;cv.width=cv.height=n*cl+p*2;
 var x=cv.getContext('2d'),sd=0;for(var i=0;i<seed.length;i++)sd=sd*31+seed.charCodeAt(i)|0;
 function r(){sd|=0;sd=sd+0x6D2B79F5|0;var t=Math.imul(sd^sd>>>15,1|sd);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}
 x.fillStyle='#F2EDDE';x.fillRect(0,0,cv.width,cv.height);x.fillStyle='#14130F';
 for(var a=0;a<n;a++)for(var b=0;b<n;b++){if((a<7&&b<7)||(a<7&&b>n-8)||(a>n-8&&b<7))continue;if(r()<.45)x.fillRect(p+b*cl,p+a*cl,cl-1,cl-1)}
 var f=function(a,b){x.fillRect(p+b*cl,p+a*cl,7*cl,7*cl);x.fillStyle='#F2EDDE';x.fillRect(p+(b+1)*cl,p+(a+1)*cl,5*cl,5*cl);x.fillStyle='#14130F';x.fillRect(p+(b+2)*cl,p+(a+2)*cl,3*cl,3*cl)};
 f(0,0);f(0,n-7);f(n-7,0);
}
function phH(code,msg){return '<div class="ph"><div class="t">khanhOS · bây giờ</div><div class="m">'+msg+' <b>'+esc(code)+'</b>. Không chia sẻ.</div><div class="n">Demo cục bộ — không có SMS thật, mã hiển thị tại đây</div></div>'}
function bO(row,cb){
 row.innerHTML='';var is=[];
 for(var i=0;i<6;i++){var p=document.createElement('input');p.maxLength=1;p.inputMode='numeric';row.appendChild(p);is.push(p)}
 is[0].focus();
 is.forEach(function(p,i){
  p.oninput=function(){p.value=p.value.replace(/\D/g,'');if(p.value&&i<5)is[i+1].focus();if(is.every(function(x){return x.value}))cb()};
  p.onkeydown=function(e){if(e.key==='Backspace'&&!p.value&&i){is[i-1].value='';is[i-1].focus()}};
 });
 return{v:function(){return is.map(function(x){return x.value}).join('')},c:function(){is.forEach(function(x){x.value=''});is[0].focus()},sh:function(){row.style.animation='none';setTimeout(function(){row.style.animation='shk .4s'},10)}};
}
function cd(btn,fn){
 var s=0,iv=null;
 function start(){s=60;btn.disabled=true;btn.textContent='Gửi lại sau 60s';
  if(iv)clearInterval(iv);
  iv=setInterval(function(){if(!btn.isConnected){clearInterval(iv);iv=null;return}
   s--;if(s<=0){clearInterval(iv);iv=null;btn.disabled=false;btn.textContent='Gửi lại mã'}
   else btn.textContent='Gửi lại sau '+s+'s'},1000)}
 btn.onclick=function(){if(btn.disabled)return;fn();start()};
 start();
}

/* ===== state ===== */
var users={},ses=null,dat=null,cid=null,gen=false,ctl=null,otpX=null;
function loadU(){try{users=JSON.parse(store.g(KU)||'{}')}catch(e){users={}}}
function saveU(){store.s(KU,JSON.stringify(users))}
function rdD(e){try{return JSON.parse(store.g(KD(e))||'null')}catch(x){return null}}
function loadD(e){dat=rdD(e)||{key:'',sys:'',model:'',cs:[],u:{d:today(),t:0},ob:false};save()}
function save(){store.s(KD(ses),JSON.stringify(dat))}
function own(){return ses===OWNER}
function pk(){return (users[ses]||{}).plan||'free'}
function pl(){return PLANS[pk()]}
function resetU(){if(!dat.u||dat.u.d!==today()){dat.u={d:today(),t:0};save()}}
function cby(id){var r=null;(dat.cs||[]).forEach(function(c){if(c.id===id)r=c});return r}
function cv(){return cby(cid)}
function eC(){if(!cv()){var c={id:'c'+Date.now().toString(36)+Math.floor(Math.random()*1e3),t:'',cr:Date.now(),up:Date.now(),m:[]};dat.cs.push(c);cid=c.id}return cv()}

/* ===== AUTH ===== */
function tab(t){$('#tL').classList.toggle('on',t==='l');$('#tR').classList.toggle('on',t==='r');$('#fL').hidden=t!=='l';$('#fR').hidden=t!=='r'}
 $('#tL').onclick=function(){tab('l')};
 $('#tR').onclick=function(){tab('r')};
 $('#goR').onclick=function(){tab('r')};
 $('#goL').onclick=function(){tab('l')};
function ferr(f,m){var e=document.querySelector('.e[data-f="'+f+'"]');if(e){e.textContent=m||'';e.style.display=m?'block':'none'}}
function clrE(){$$('.e').forEach(function(e){e.style.display='none';e.textContent=''})}
 $('#fL').onsubmit=function(ev){ev.preventDefault();clrE();var ok=true;
 var em=$('#le').value.trim(),pw=$('#lp').value;
 if(!REM.test(em)){ferr('le','Email không hợp lệ');ok=false}
 if(pw.length<6){ferr('lp','Mật khẩu tối thiểu 6 ký tự');ok=false}
 if(!ok)return;
 var u=users[em];
 if(!u){ferr('le','Không tìm thấy tài khoản này');return}
 hash(pw).then(function(h){
  if(u.p!==h){ferr('lp','Sai mật khẩu');return}
  ses=em;store.s(KS,ses);enterApp();toast('Chào trở lại, '+(u.n||'bạn'),'ok');
 });
};
 $('#fR').onsubmit=function(ev){ev.preventDefault();clrE();var ok=true;
 var n=$('#rn').value.trim(),em=$('#re').value.trim(),p=$('#rp').value,p2=$('#rp2').value;
 if(n.length<2){ferr('rn','Tên tối thiểu 2 ký tự');ok=false}
 if(!REM.test(em)){ferr('re','Email không hợp lệ');ok=false}
 if(p.length<6){ferr('rp','Mật khẩu tối thiểu 6 ký tự');ok=false}
 if(p!==p2){ferr('rp2','Mật khẩu không khớp');ok=false}
 if(!ok)return;
 if(users[em]){ferr('re','Email này đã có tài khoản');return}
 hash(p).then(function(h){
  users[em]={n:n,p:h,plan:'free',cr:Date.now()};saveU();
  ses=em;store.s(KS,ses);enterApp();toast('Đã cài khanhOS — chào '+n+'!','ok');
 });
};

/* ===== APP ===== */
var DEF={free:'llama3.1-8b',plus:'llama-3.3-70b',max:'gpt-oss-120b'};
function rank(){return own()?2:RANK[pk()]}
function sysNow(){return (own()||pk()==='max')&&dat.sys?dat.sys:SYS}
function curModel(){var r=rank();var m=MODELS.filter(function(x){return x.id===dat.model})[0];if(!m||RANK[m.p]>r)dat.model=DEF[pk()];return dat.model}
function enterApp(){
 $('#auth').hidden=true;$('#app').hidden=false;
 loadD(ses);resetU();
 $('#un').textContent=users[ses].n||ses;
 $('#ob').hidden=!own();
 if(!dat.ob){dat.ob=true;save();setTimeout(mWelcome,250)}
 eC();renderAll();$('#tx').focus();
}
function logout(){store.d(KS);ses=null;dat=null;cid=null;$('#app').hidden=true;$('#auth').hidden=false;tab('l');$('#le').value='';$('#lp').value='';toast('Đã thoát','info')}
function renderAll(){renderList();renderMsel();renderHead();renderMsgs()}
function renderHead(){$('#pn').textContent=pl().n;$('#pt').textContent=pl().n;renderPill()}
function renderPill(){$('#pill').textContent=fT(dat.u.t)+' / '+fT(pl().tok)+' token · hôm nay'}
function renderMsel(){var r=rank(),s=$('#msel');
 s.innerHTML=MODELS.filter(function(m){return RANK[m.p]<=r}).map(function(m){return '<option value="'+m.id+'">'+esc(m.l)+'</option>'}).join('');
 s.value=curModel();
}
function renderList(){
 var cs=(dat.cs||[]).slice().sort(function(a,b){return b.up-a.up});
 $('#list').innerHTML=cs.map(function(c){
  return '<div class="cv'+(c.id===cid?' on':'')+'" data-id="'+c.id+'">'+
  '<div class="ct"><span>'+esc(c.t||'Hội thoại mới')+'</span><button type="button" data-del="'+c.id+'" title="Xóa hội thoại">✕</button></div>'+
  '<small>'+ago(c.up)+' · '+c.m.length+' tin</small></div>'
 }).join('');
}
function renderMsgs(){var c=cv(),h='';
 (c?c.m:[]).forEach(function(m){
  if(m.r==='u')h+='<div class="mg u"><div class="who">BẠN</div><div>'+esc(m.t).replace(/\n/g,'<br>')+'</div></div>';
  else h+='<div class="mg a"><div class="who"><b>KHANH</b>OS'+(m.mdl?' · '+esc(m.mdl):'')+'</div><div class="md">'+md(m.t)+'</div></div>';
 });
 if(!h)h='<div class="mg a"><div class="who"><b>KHANH</b>OS</div><div class="md"><p>Chào bạn — tôi là <b>khanhOS</b>, trợ lý AI chạy trên hạ tầng Cerebras.</p><p>Hỏi bất cứ điều gì: code, ý tưởng, dịch thuật. Gõ xuống bên dưới và Enter.</p></div></div>';
 $('#ms').innerHTML=h;sb();
}
function sb(){var s=$('#sc');s.scrollTop=s.scrollHeight}
 $('#list').addEventListener('click',function(e){
 var d=e.target.getAttribute('data-del');
 if(d){e.stopPropagation();
  dat.cs=dat.cs.filter(function(c){return c.id!==d});
  if(cid===d){cid=null;eC()}
  save();renderList();renderMsgs();return}
 var row=e.target.closest('.cv');if(!row)return;
 cid=row.getAttribute('data-id');renderList();renderMsgs();document.body.classList.remove('so');
});

/* ===== CHAT ===== */
function setBtn(){var b=$('#sb');b.classList.toggle('stop',gen);b.textContent=gen?'■':'▲'}
function ask(p,sig){
 var b=JSON.stringify(p);
 if(dat.key){
  return fetch(API,{method:'POST',signal:sig,headers:{'Content-Type':'application/json',Authorization:'Bearer '+dat.key},body:b})
   .catch(function(){return fetch('/api/chat',{method:'POST',signal:sig,headers:{'Content-Type':'application/json'},body:b})});
 }
 return fetch('/api/chat',{method:'POST',signal:sig,headers:{'Content-Type':'application/json'},body:b});
}
function emsg(st,tx){
 if(st===404)return 'Không có /api/chat trên host này (GitHub Pages chỉ chạy tĩnh). Deploy lên Vercel với biến CEREBRAS_API_KEY, hoặc mở Cài đặt nhập key riêng.';
 if(st===401||st===403)return 'API key không hợp lệ (401)';
 var s=String(tx||'');try{var j=JSON.parse(s);s=(j.error&&j.error.message)||j.error||s}catch(e){}
 s=s.replace(/\s+/g,' ').trim();return s.slice(0,180)||('HTTP '+st);
}
function send(){
 if(gen){if(ctl)ctl.abort();return}
 var t=$('#tx').value.trim();if(!t)return;
 resetU();
 if(dat.u.t>=pl().tok){toast('Hết '+fT(pl().tok)+' token hôm nay — xem gói nâng cấp','warn');mPlans();return}
 var c=eC();
 if(!c.t)c.t=t.length>60?t.slice(0,60)+'…':t;
 c.m.push({r:'u',t:t,c:Date.now()});c.up=Date.now();
 $('#tx').value='';$('#tx').style.height='auto';
 renderMsgs();renderList();save();
 var msgs=[],sy=sysNow();
 if(sy)msgs.push({role:'system',content:sy});
 c.m.slice(-HIST[pk()]).forEach(function(m){msgs.push({role:m.r==='u'?'user':'assistant',content:m.t})});
 var model=curModel(),inCh=JSON.stringify(msgs).length,t0=Date.now(),full='',use=0;
 ctl=new AbortController();gen=true;setBtn();
 var blk=document.createElement('div');blk.className='mg a';
 blk.innerHTML='<div class="who"><b>KHANH</b>OS · '+esc(model)+'</div><div class="md"><p class="dots"><span></span><span></span><span></span></p></div>';
 $('#ms').appendChild(blk);sb();
 var mdEl=blk.querySelector('.md'),live=false;
 function put(tx){if(!live){mdEl.innerHTML='';live=true}full+=tx;mdEl.textContent=full;sb()}
 function fin(err,stopped){
  gen=false;ctl=null;setBtn();
  if(err){mdEl.innerHTML=md('⚠ '+err);return}
  if(full){
   mdEl.innerHTML=md(full);
   c.m.push({r:'a',t:full,mdl:model});c.up=Date.now();
   var tk=use||Math.ceil((inCh+full.length)/4);
   dat.u.t+=tk;save();renderPill();renderList();
   var pc=Math.round(dat.u.t/pl().tok*100);
   blk.insertAdjacentHTML('beforeend','<div class="sys"><div class="kh">khanhOS · log</div>'+
    '<div class="r"><b>model</b><i>'+esc(model)+'</i></div>'+
    '<div class="r"><b>token phiên</b><i>'+tk+'</i></div>'+
    '<div class="r"><b>hôm nay</b><i>'+fT(dat.u.t)+'/'+fT(pl().tok)+'</i></div>'+
    '<div class="r"><b>độ trễ</b><i>'+((Date.now()-t0)/1000).toFixed(1)+'s</i></div>'+
    (pc>=80?'<div class="r"><b>hạn mức</b><span class="dn">đã dùng '+pc+'% — cân nhắc nâng cấp</span></div>':'')+
    '</div>');sb();
  }else if(stopped){mdEl.innerHTML=md('(đã dừng)')}
 }
 ask({model:model,messages:msgs,stream:true,max_tokens:pl().mt},ctl.signal).then(function(res){
  if(!res.ok)return res.text().then(function(tx){throw new Error(emsg(res.status,tx))});
  var ct=(res.headers.get('content-type')||'');
  if(ct.indexOf('event-stream')<0){
   return res.json().then(function(d){
    var a=d&&d.choices&&d.choices[0]?(d.choices[0].message||{}).content:(d&&d.reply);
    if(d&&d.usage)use=d.usage.total_tokens||0;
    if(a)put(a);fin(null);
   });
  }
  var rd=res.body.getReader(),dec=new TextDecoder(),buf='';
  function pump(){return rd.read().then(function(r){
   if(r.value)buf+=dec.decode(r.value,{stream:true});
   if(r.done)buf+=dec.decode();
   var ls=buf.split('\n');buf=ls.pop();
   for(var i=0;i<ls.length;i++){
    var L=ls[i].trim();if(L.indexOf('data:')!==0)continue;
    var D=L.slice(5).trim();if(D==='[DONE]')return;
    var j=null;try{j=JSON.parse(D)}catch(e){}
    if(!j)continue;
    if(j.usage&&j.usage.total_tokens)use=j.usage.total_tokens;
    var d=j.choices&&j.choices[0]&&j.choices[0].delta;
    if(d&&d.content)put(d.content);
   }
   return pump();
  })}
  return pump();
 }).catch(function(e){
  if(e&&e.name==='AbortError'){fin(null,true);return}
  fin(emsg(0,String(e&&e.message||e)));
 });
}
 $('#tx').addEventListener('input',function(){this.style.height='auto';this.style.height=Math.min(this.scrollHeight,150)+'px'});
 $('#tx').addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});
 $('#sb').onclick=send;
 $('#ms').addEventListener('click',function(e){
 var b=e.target.closest('.cp');if(!b)return;
 var pre=b.closest('.cb').querySelector('pre');
 if(navigator.clipboard)navigator.clipboard.writeText(pre.textContent).then(function(){toast('Đã chép code','ok')});
});

/* ===== MODALS ===== */
function mPlans(){
 var cur=pk();
 mO('<h3>Gói dịch vụ</h3><p class="ms">Token reset mỗi ngày 00:00. Thanh toán demo: MoMo · ZaloPay · VNPay · ShopeePay · Napas.</p>'+
 Object.keys(PLANS).map(function(k){
  var p=PLANS[k],on=k===cur;
  return '<div class="pr'+(on?' m':'')+'"><div><div class="nm">'+p.n+'</div><div class="ds">'+p.feats.join(' · ')+'</div></div>'+
  '<div class="go"><div class="p">'+p.pr+'</div><button type="button" class="'+(on?'cur':(k==='free'?'':'ar'))+'" data-pl="'+k+'">'+(on?'Đang dùng':(k==='free'?'Quay về FREE':'Chọn '+p.n))+'</button></div></div>';
 }).join(''));
 $('#mp').onclick=function(e){
  var b=e.target.closest('[data-pl]');if(!b||b.classList.contains('cur'))return;
  var k=b.getAttribute('data-pl');
  if(k==='free'){users[ses].plan='free';saveU();dat.model=DEF.free;save();mC();toast('Đã quay về FREE','info');renderAll()}
  else mPay(k);
 };
}
function mPay(k){
 var p=PLANS[k];
 mO('<h3>Thanh toán '+p.n+'</h3><p class="ms">'+p.pr+' · 1 tháng · '+p.feats.join(' · ')+'</p>'+
 '<div class="apps">'+APPS.map(function(a){return '<button type="button" class="ap" data-ap="'+a.id+'"><span class="b" style="background:'+a.c+'">'+a.b+'</span>'+a.n+'</button>'}).join('')+'</div>'+
 '<div id="pstep" hidden>'+
 '<div class="qr"><canvas id="qrc"></canvas><div><div class="amt">'+fV(p.vnd)+'</div><div class="inf" id="qri"></div></div></div>'+
 '<div class="f" style="margin-top:14px"><label>Số điện thoại ví</label><input id="phn" inputmode="numeric" maxlength="11" placeholder="0901234567"/></div>'+
 '<button class="btn" id="potp" type="button">Gửi mã OTP</button>'+
 '<div class="ot" id="orow" hidden></div><div id="pshow"></div></div>');
 var armed=false;
 var o=bO($('#orow'),function(){
  var v=o.v();
  if(!otpX||v!==otpX.code){o.sh();o.c();toast('Mã OTP không đúng','warn');return}
  users[ses].plan=k;saveU();
  dat.model=DEF[k];save();mC();
  toast('Đã kích hoạt '+p.n+' — hạn mức mới có ngay','ok');
  renderAll();
 });
 function arm(){
  var ph=$('#phn').value.trim();
  if(!RPH.test(ph)){toast('Số điện thoại không hợp lệ (VD 0901234567)','warn');$('#phn').focus();return}
  otpX={code:otp(),plan:k,ph:ph};
  $('#pshow').innerHTML=phH(otpX.code,'Mã xác minh của bạn:');
  $('#orow').hidden=false;o.c();
  if(!armed){armed=true;cd($('#potp'),arm)}
 }
 $('#potp').onclick=arm;
 $('#mp').onclick=function(e){
  var b=e.target.closest('[data-ap]');if(!b)return;
  $$('#mp .ap').forEach(function(x){x.style.borderColor=''});
  b.style.borderColor='var(--ac)';
  $('#pstep').hidden=false;
  var a=APPS.filter(function(x){return x.id===b.getAttribute('data-ap')})[0];
  otpX=null;$('#pshow').innerHTML='';$('#orow').hidden=true;
  qr($('#qrc'),k+Date.now());
  $('#qri').innerHTML='Chuyển <b>'+fV(p.vnd)+'</b> qua '+a.n+'<br>Gói '+p.n+' · 1 tháng · khanhOS';
 };
}
function mSet(){
 var syOK=own()||pk()==='max';
 mO('<h3>Cài đặt</h3><p class="ms">Key lưu cục bộ trên trình duyệt — nếu để trống, mọi yêu cầu đi qua <b>/api/chat</b> (key nằm trên server).</p>'+
 '<div class="f"><label>API key Cerebras (tuỳ chọn)</label><input
