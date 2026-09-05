/* khanhOS — app.js · PHẦN 1/2: tiện ích + đăng nhập
   Dòng cuối của file này PHẢI là dòng "✓ HẾT PHẦN 1" — nếu không thấy nghĩa là bị cắt, dán lại. */

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
 var TRI=String.fromCharCode(96,96,96);
 var parts=t.split(TRI),o='';
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

function qr(cvs,seed){
 var n=21,cl=9,p=2;cvs.width=cvs.height=n*cl+p*2;
 var x=cvs.getContext('2d'),sd=0;for(var i=0;i<seed.length;i++)sd=sd*31+seed.charCodeAt(i)|0;
 function r(){sd|=0;sd=sd+0x6D2B79F5|0;var t=Math.imul(sd^sd>>>15,1|sd);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}
 x.fillStyle='#F2EDDE';x.fillRect(0,0,cvs.width,cvs.height);x.fillStyle='#14130F';
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

/* ✓ HẾT PHẦN 1 — dòng này PHẢI là dòng cuối cùng của file app.js */
