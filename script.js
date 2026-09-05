/* ============ khanhOS — script.js ============
   Đăng ký: email + mật khẩu. SĐT + OTP: chỉ khi mua gói. */
const OWNER='hoangbaokhanhhehe@gmail.com';
const $=s=>document.querySelector(s);
const API='https://api.cerebras.ai/v1/chat/completions',APIM='https://api.cerebras.ai/v1/models';
const KU='kos_users2',KS='kos_session2',KD=e=>'kos_d2_'+e;
const RE=/^[^\s@]+@[^\s@]+\.[^\s@]+$/,REPH=/^0\d{9,10}$/;
const PLANS={
  free:{name:'FREE',tok:10000,mtok:2048,vnd:0,price:'0₫',desc:'Đủ để khám phá mỗi ngày.',feats:['10.000 token/ngày','Model Llama 3.1 8B','Hội thoại lưu cục bộ']},
  plus:{name:'PLUS',tok:100000,mtok:4096,vnd:99000,price:'99.000₫/tháng',desc:'Cho công việc hằng ngày.',feats:['100.000 token/ngày','Llama 3.3 70B · Scout · Qwen 3 32B','Trả lời dài hơn']},
  max:{name:'MAX',tok:500000,mtok:8192,vnd:299000,price:'299.000₫/tháng',desc:'Mọi thứ, mở hết.',feats:['500.000 token/ngày','GPT-OSS 120B · Qwen 3 235B','System prompt riêng']}
};
const RANK={free:0,plus:1,max:2},HIST={free:8,plus:20,max:40};
const MODELS=[
  {id:'llama3.1-8b',l:'Llama 3.1 · 8B',t:'Nhanh & nhẹ',p:'free'},
  {id:'llama-3.3-70b',l:'Llama 3.3 · 70B',t:'Cân bằng',p:'plus'},
  {id:'llama-4-scout-17b-16e-instruct',l:'Llama 4 Scout',t:'Đa phương thức',p:'plus'},
  {id:'qwen-3-32b',l:'Qwen 3 · 32B',t:'Lập trình',p:'plus'},
  {id:'gpt-oss-120b',l:'GPT-OSS · 120B',t:'Suy luận sâu',p:'max'},
  {id:'qwen-3-235b-a22b-instruct-2507',l:'Qwen 3 · 235B',t:'Mạnh nhất',p:'max'}
];
const APPS=[{id:'momo',n:'MoMo',b:'M',c:'#A50064'},{id:'zalo',n:'ZaloPay',b:'Z',c:'#0B63CE'},{id:'vnpay',n:'VNPay QR',b:'V',c:'#123D8C'},{id:'shop',n:'ShopeePay',b:'S',c:'#EE4D2D'},{id:'napas',n:'Thẻ Napas',b:'N',c:'#41506B'}];
const DEF_SYS='Bạn là khanhOS Assistant, trợ lý AI chạy trên hạ tầng Cerebras. Trả lời chính xác, súc tích, tự nhiên, bằng ngôn ngữ người dùng đang dùng. Viết code thì dùng markdown code block kèm tên ngôn ngữ.';
const SUGS=['Giải thích TCP vs UDP như cho học sinh cấp 3','Viết hàm JavaScript debounce kèm giải thích','Lên kế hoạch 3 ngày ở Đà Nẵng với 2 triệu đồng','Viết email xin nghỉ phép chuyên nghiệp'];

/* ---- tiện ích ---- */
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const today=()=>new Date().toLocaleDateString('sv');
const fmtTok=n=>n>=1000?(n/1000).toFixed(1).replace('.',',').replace(',0','')+'k':String(n);
const fmtVnd=n=>n.toLocaleString('vi-VN')+'₫';
const fmtDate=t=>new Date(t).toLocaleDateString('vi-VN');
const ago=t=>{const s=(Date.now()-t)/1e3;return s<60?'vừa xong':s<3600?Math.floor(s/60)+' phút trước':s<86400?Math.floor(s/3600)+' giờ trước':Math.floor(s/86400)+' ngày trước'};
async function hash(s){try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('kos:'+s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0}return'f'+h.toString(16)}}
const genOtp=()=>String(Math.floor(1e5+Math.random()*9e5));

/* ---- icon ---- */
const ICONS={
  send:'<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 22-7z"/>',
  stop:'<rect x="7" y="7" width="10" height="10" rx="1.5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  trash:'<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
  pencil:'<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 3 22l1.5-4.5L17 3z"/>',
  settings:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  chev:'<path d="m6 9 6 6 6-6"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  refresh:'<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
  zap:'<path d="M13 2 3 14h7l-1 8 11-14h-8l1-6z"/>',
  menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
  alert:'<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>',
  eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff:'<path d="M17.94 17.94A10 10 0 0 1 12 20c-7 0-11-8-11-8a18 18 0 0 1 5-6M9.9 4.2A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.2 3.2"/><path d="M14.1 14.1a3 3 0 1 1-4.2-4.2"/><line x1="2" y1="2" x2="22" y2="22"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>'
};
const ic=n=>'<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+ICONS[n]+'</svg>';
document.querySelectorAll('[data-ic]').forEach(el=>el.insertAdjacentHTML('afterbegin',ic(el.dataset.ic)));

/* ---- markdown ---- */
const inl=s=>s.replace(/`([^`]+)`/g,'<code class="ic">$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<em>$2</em>').replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
function blocks(s){
  const L=s.split('\n');let o='',i=0;const E=x=>esc(x);
  while(i<L.length){
    if(!L[i].trim()){i++;continue}
    const line=E(L[i]);let m;
    if(m=line.match(/^(#{1,4})\s+(.*)/)){const h=Math.min(m[1].length+1,4);o+='<h'+h+'>'+inl(m[2])+'</h'+h+'>';i++;continue}
    if(/^[-*]\s/.test(line)){const it=[];while(i<L.length&&/^[-*]\s/.test(E(L[i]))){it.push(inl(E(L[i]).replace(/^[-*]\s+/,'')));i++}o+='<ul>'+it.map(t=>'<li>'+t+'</li>').join('')+'</ul>';continue}
    if(/^\d+[.)]\s/.test(line)){const it=[];while(i<L.length&&/^\d+[.)]\s/.test(E(L[i]))){it.push(inl(E(L[i]).replace(/^\d+[.)]\s+/,'')));i++}o+='<ol>'+it.map(t=>'<li>'+t+'</li>').join('')+'</ol>';continue}
    const p=[line];i++;
    while(i<L.length&&L[i].trim()&&!/^(#{1,4}\s|[-*]\s|\d+[.)]\s)/.test(E(L[i]))){p.push(E(L[i]));i++}
    o+='<p>'+inl(p.join('<br>'))+'</p>';
  }
  return o;
}
function md(src){
  const parts=String(src??'').split('```');let o='';
  for(let i=0;i<parts.length;i++){
    if(i%2){let c=parts[i],l='';const n=c.indexOf('\n');
      if(n>-1){const f=c.slice(0,n).trim();if(/^[\w+#.-]+$/.test(f)){l=f;c=c.slice(n+1)}}
      o+='<div class="code"><div class="code-h"><span>'+esc(l||'code')+'</span><button class="cc" type="button">'+ic('copy')+'<span>Chép</span></button></div><pre><code>'+esc(c.replace(/\n$/,''))+'</code></pre></div>';
    }else o+=blocks(parts[i]);
  }
  return o;
}

/* ---- toast & modal ---- */
function toast(m,t){t=t||'info';const d=document.createElement('div');d.className='toast '+t;d.innerHTML=ic(t==='ok'?'check':t==='warn'?'alert':'info')+'<span>'+esc(m)+'</span>';$('#toasts').appendChild(d);requestAnimationFrame(()=>d.classList.add('on'));setTimeout(()=>{d.classList.remove('on');setTimeout(()=>d.remove(),300)},3000)}
function openM(h){$('#mPanel').innerHTML=h;const m=$('#modal');m.hidden=false;requestAnimationFrame(()=>m.classList.add('open'))}
function closeM(){$('#modal').classList.remove('open');setTimeout(()=>{$('#modal').hidden=true;$('#mPanel').innerHTML=''},200)}
 $('#modal').addEventListener('click',e=>{if(e.target.classList.contains('m-back')||e.target.closest('.close-x'))closeM()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#modal').hidden)closeM();else document.body.classList.remove('sbo')}});

/* ---- QR mô phỏng ---- */
function drawQR(cv,sd0){
  const n=25,cell=8,pad=4;cv.width=cv.height=n*cell+pad*2;
  const x=cv.getContext('2d');let sd=0;for(const c of sd0)sd=sd*31+c.charCodeAt(0)|0;
  const rnd=()=>{sd|=0;sd=sd+0x6D2B79F5|0;let t=Math.imul(sd^sd>>>15,1|sd);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
  x.fillStyle='#F2EDDE';x.fillRect(0,0,cv.width,cv.height);x.fillStyle='#14130F';
  for(let r=0;r<n;r++)for(let c=0;c<n;c++){
    if((r<7&&c<7)||(r<7&&c>n-8)||(r>n-8&&c<7))continue;
    if(rnd()<.46)x.fillRect(pad+c*cell,pad+r*cell,cell-1,cell-1);
  }
  const f=(r,c)=>{x.fillRect(pad+c*cell,pad+r*cell,7*cell,7*cell);x.fillStyle='#F2EDDE';x.fillRect(pad+(c+1)*cell,pad+(r+1)*cell,5*cell,5*cell);x.fillStyle='#14130F';x.fillRect(pad+(c+2)*cell,pad+(r+2)*cell,3*cell,3*cell)};
  f(0,0);f(0,n-7);f(n-7,0);
}

/* ---- OTP helpers ---- */
function phoneHtml(code,msg){
  return '<div class="phone"><div class="ph-top"><b>khanhOS</b><span>bây giờ</span></div>'+
  '<div class="ph-msg">'+msg+' <b>'+esc(code)+'</b>. Không chia sẻ với ai.</div>'+
  '<div class="ph-note">Demo cục bộ — không có SMS thật, mã hiển thị tại đây.</div></div>';
}
function buildOtp(row,cb){
  row.innerHTML='';const is=[];
  for(let i=0;i<6;i++){const p=document.createElement('input');p.className='otp-in';p.type='text';p.inputMode='numeric';p.maxLength=1;p.setAttribute('aria-label','OTP '+(i+1));row.appendChild(p);is.push(p)}
  is[0].focus();
  is.forEach((p,i)=>{
    p.oninput=()=>{p.value=p.value.replace(/\D/g,'');if(p.value&&i<5)is[i+1].focus();if(is.every(x=>x.value))cb()};
    p.onkeydown=e=>{if(e.key==='Backspace'&&!p.value&&i){is[i-1].value='';is[i-1].focus();e.preventDefault()}};
    p.onpaste=e=>{e.preventDefault();const d=(e.clipboardData.getData('text')||'').replace(/\D/g,'').slice(0,6);if(!d)return;d.split('').forEach((c,j)=>{if(is[j])is[j].value=c});is[Math.min(d.length,5)].focus();if(d.length===6)cb()};
  });
  return{get:()=>is.map(x=>x.value).join(''),clear:()=>{is.forEach(x=>x.value='');is[0].focus()},shake:()=>{row.classList.add('shake');setTimeout(()=>row.classList.remove('shake'),450)}};
}
function countdown(btn,onResend){
  let s=60;btn.disabled=true;btn.textContent='Gửi lại sau 60s';
  const iv=setInterval(()=>{if(!btn.isConnected){clearInterval(iv);return}s--;
    if(s<=0){clearInterval(iv);btn.disabled=false;btn.textContent='Gửi lại mã';return}
    btn.textContent='Gửi lại sau '+s+'s'},1000);
  btn.onclick=()=>{if(btn.disabled)return;s=60;onResend();btn.textContent='Gửi lại sau 60s'};
}

/* ---- trạng thái ---- */
let users={},session=null,data=null,curId=null;
let gen=false,ctl=null,se=null,sb=null,buf='',pend=false;
let otpCtx=null,pay=null;
const loadU=()=>{try{users=JSON.parse(localStorage.getItem(KU)||'{}')}catch(e){users={}}};
const saveU=()=>localStorage.setItem(KU,JSON.stringify(users));
const readD=e=>{try{return JSON.parse(localStorage.getItem(KD(e))||'null')}catch(_){return null}};
function loadD(e){
  data=readD(e);
  if(!data){data={key:'',sys:'',model:'llama3.1-8b',convs:[],usage:{date:today(),tok:0},onb:false};saveD()}
}
const saveD=()=>localStorage.setItem(KD(session),JSON.stringify(data));
const isOwner=()=>session===OWNER;
const pk=()=>(users[session]||{}).plan||'free';
const plan=()=>PLANS[pk()];
const models=()=>MODELS.filter(m=>RANK[m.p]<=RANK[pk()]);
const modelOk=id=>models().some(m=>m.id===id);
const mL=id=>(MODELS.find(m=>m.id===id)||{}).l||'';
function resetUsage(){if(!data.usage||data.usage.date!==today()){data.usage={date:today(),tok:0};saveD()}}

/* ============ AUTH — đăng ký chỉ email + mật khẩu ============ */
function tab(t){
  $('#tLogin').classList.toggle('on',t==='login');$('#tReg').classList.toggle('on',t==='reg');
  $('#fLogin').hidden=t!=='login';$('#fReg').hidden=t!=='reg';
}
 $('#tLogin').onclick=()=>tab('login');
 $('#tReg').onclick=()=>tab('reg');
document.querySelectorAll('.swap button[data-go]').forEach(b=>b.onclick=()=>tab(b.dataset.go));
function fErr(k,m){const e=document.querySelector('.err[data-for="'+k+'"]'),i=document.getElementById(k);if(e){e.textContent=m;e.classList.add('on')}if(i)i.classList.add('bad')}
function fClr(f){f.querySelectorAll('.err').forEach(e=>e.classList.remove('on'));f.querySelectorAll('input').forEach(i=>i.classList.remove('bad'))}

 $('#fReg').addEventListener('submit',async e=>{
  e.preventDefault();fClr(e.target);
  const name=$('#rg-name').value.trim(),email=$('#rg-email').value.trim().toLowerCase();
  const p1=$('#rg-pass').value,p2=$('#rg-pass2').value;let ok=true;
  if(name.length<2){fErr('rg-name','Tên cần ít nhất 2 ký tự');ok=false}
  if(!RE.test(email)){fErr('rg-email','Email chưa hợp lệ');ok=false}
  if(p1.length<6){fErr('rg-pass','Tối thiểu 6 ký tự');ok=false}
  if(p2!==p1){fErr('rg-pass2','Hai mật khẩu không khớp');ok=false}
  if(ok&&users[email]){fErr('rg-email','Email đã có tài khoản — thử đăng nhập');ok=false}
  if(!ok)return;
  const b=$('#fReg button.btn');b.disabled=true;b.textContent='Đang tạo…';
  users[email]={name,pass:await hash(p1),created:Date.now(),plan:'free',phone:''};
  saveU();
  session=email;localStorage.setItem(KS,email);loadD(email);
  setTimeout(()=>{b.disabled=false;b.textContent='Tạo tài khoản';enterApp()},400);
});

 $('#fLogin').addEventListener('submit',async e=>{
  e.preventDefault();fClr(e.target);
  const email=$('#lg-email').value.trim().toLowerCase(),pass=$('#lg-pass').value;let ok=true;
  if(!RE.test(email)){fErr('lg-email','Email chưa hợp lệ');ok=false}
  if(!pass){fErr('lg-pass','Nhập mật khẩu');ok=false}
  const u=users[email];
  if(!u){fErr('lg-email','Không tìm thấy tài khoản');ok=false}
  if(!ok)return;
  const b=$('#fLogin button.btn');b.disabled=true;b.textContent='Đang xác thực…';
  if(await hash(pass)!==u.pass){b.disabled=false;b.textContent='Đăng nhập';fErr('lg-pass','Mật khẩu không đúng');return}
  session=email;localStorage.setItem(KS,email);loadD(email);
  setTimeout(()=>{b.disabled=false;b.textContent='Đăng nhập';enterApp()},400);
});
function logout(){
  if(ctl)ctl.abort();
  localStorage.removeItem(KS);session=null;data=null;curId=null;
  $('#app').hidden=true;$('#auth').hidden=false;tab('login');
  $('#fLogin').reset();$('#fReg').reset();
}
 $('#outBtn').onclick=logout;

/* ============ APP ============ */
function enterApp(){
  $('#auth').hidden=true;$('#app').hidden=false;
  resetUsage();
  if(!data.model||!modelOk(data.model))data.model=models()[0].id;
  saveD();
  $('#uName').textContent=(users[session]||{}).name||session;
  $('#avatar').textContent=(((users[session]||{}).name||'?').trim()[0]||'?').toUpperCase();
  $('#ownerB').hidden=!isOwner();
  $('#inp').placeholder=isOwner()?'Nhập lệnh (/help) hoặc tin nhắn…':'Nhập tin nhắn cho khanhOS…';
  renderSide();renderHdr();renderConv();
  if(!data.key&&!data.onb){data.onb=true;saveD();setTimeout(()=>{openSettings();toast('Thêm API key Cerebras để bắt đầu','info')},400)}
}
/* ---- sidebar ---- */
const getC=id=>(data.convs||[]).find(c=>c.id===id);
const conv=()=>getC(curId);
function renderSide(){
  const q=$('#q').value.trim().toLowerCase();
  const items=(data.convs||[]).slice().sort((a,b)=>b.up-a.up).filter(c=>!q||(c.title||'').toLowerCase().includes(q));
  $('#convList').innerHTML=items.length?items.map(c=>
    '<div class="cv'+(c.id===curId?' on':'')+'" data-id="'+c.id+'">'+
    '<div class="cv-t">'+esc(c.title||'Hội thoại mới')+'</div>'+
    '<div class="cv-time">'+ago(c.up)+'</div>'+
    '<div class="cv-acts"><button class="ca" data-act="rn" title="Đổi tên">'+ic('pencil')+'</button>'+
    '<button class="ca" data-act="del" title="Xóa">'+ic('trash')+'</button></div></div>').join('')
    :'<div class="sb-empty">'+(q?'Không tìm thấy.':'Chưa có hội thoại nào.<br>Bắt đầu bằng nút phía trên.')+'</div>';
}
 $('#q').oninput=renderSide;
 $('#convList').addEventListener('click',e=>{
  if(e.target.closest('.cv-rename'))return;
  const btn=e.target.closest('.ca');
  if(btn){
    const row=btn.closest('.cv'),id=row.dataset.id;
    if(btn.dataset.act==='rn'){
      const t=row.querySelector('.cv-t'),old=t.textContent;
      const inp=document.createElement('input');inp.className='cv-rename';inp.value=old;
      t.replaceWith(inp);inp.focus();inp.select();
      const go=()=>{const c=getC(id);if(c){c.title=inp.value.trim()||old;saveD()}renderSide()};
      inp.onblur=go;
      inp.onkeydown=ev=>{if(ev.key==='Enter')inp.blur();if(ev.key==='Escape'){inp.onblur=null;renderSide()}};
      return;
    }
    if(btn.dataset.act==='del'){
      if(!btn.dataset.armed){btn.dataset.armed='1';btn.classList.add('armed');setTimeout(()=>{btn.dataset.armed='';btn.classList.remove('armed')},2500);return}
      data.convs=data.convs.filter(c=>c.id!==id);
      if(curId===id)curId=null;
      saveD();renderSide();renderConv();toast('Đã xóa hội thoại','ok');
    }
    return;
  }
  const row=e.target.closest('.cv');
  if(row){if(gen)ctl.abort();curId=row.dataset.id;renderSide();renderConv();document.body.classList.remove('sbo')}
});
 $('#newBtn').onclick=()=>{if(gen)ctl.abort();curId=null;renderSide();renderConv();$('#inp').focus();document.body.classList.remove('sbo')};
 $('#menuBtn').onclick=()=>document.body.classList.add('sbo');
 $('#sbOv').onclick=()=>document.body.classList.remove('sbo');
function ensureConv(){
  if(!getC(curId)){
    const c={id:'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),title:'',cr:Date.now(),up:Date.now(),messages:[]};
    data.convs.push(c);curId=c.id;
  }
  return conv();
}
/* ---- header ---- */
function renderHdr(){
  resetUsage();
  const m=MODELS.find(x=>x.id===data.model)||models()[0];
  $('#modelName').textContent=m.l;
  $('#modelDot').className='dot'+(m.p!=='free'?' tier':'');
  $('#planTag').textContent=plan().name;$('#pcName').textContent=plan().name;
  $('#mmenu').innerHTML=models().map(x=>
    '<button class="mi'+(x.id===data.model?' on':'')+'" data-id="'+x.id+'"><span><span class="l">'+esc(x.l)+'</span><span class="t">'+esc(x.t)+' · '+PLANS[x.p].name+'</span></span>'+ic('check')+'</button>').join('');
  usePill();
}
function usePill(){
  const el=$('#usePill'),p=plan(),left=p.tok-data.usage.tok;
  el.className='upill'+(left<=0?' danger':left<p.tok*.1?' warn':'');
  el.innerHTML=ic('zap')+'<b>'+(left>0?fmtTok(left):'0')+'</b><span>/ '+fmtTok(p.tok)+' token hôm nay</span>';
}
 $('#modelBtn').onclick=e=>{e.stopPropagation();$('#mmenu').hidden=!$('#mmenu').hidden};
 $('#mmenu').addEventListener('click',e=>{
  const it=e.target.closest('.mi');if(!it)return;
  data.model=it.dataset.id;saveD();$('#mmenu').hidden=true;renderHdr();
});
document.addEventListener('click',e=>{if(!e.target.closest('.msel'))$('#mmenu').hidden=true});
 $('#usePill').onclick=()=>planModal();
 $('#planTag').onclick=()=>planModal();
 $('#planChip').onclick=()=>planModal();
/* ---- messages ---- */
const nearB=()=>$('#scroll').scrollHeight-$('#scroll').scrollTop-$('#scroll').clientHeight<130;
const sBott=()=>$('#scroll').scrollTop=$('#scroll').scrollHeight;
function emptyHtml(){
  const m=MODELS.find(x=>x.id===data.model);
  return '<div class="empty"><div class="ek">SẴN SÀNG · '+esc((m?m.l:'').toUpperCase())+(isOwner()?' · OWNER':'')+'</div>'+
  '<h1>Hôm nay ta bắt đầu<br>từ đâu?</h1>'+
  '<div>'+SUGS.map((s,i)=>'<button class="sug" data-sug="'+i+'"><i>'+String(i+1).padStart(2,'0')+'</i><span>'+esc(s)+'</span></button>').join('')+'</div></div>';
}
function msgHtml(m){
  if(m.role==='sys')return '<div class="msg s"><div class="mm"><b>khanhOS</b><span>·</span><span>OWNER CMD</span></div><div class="sys">'+m.html+'</div></div>';
  if(m.role==='user')return '<div class="msg u"><div>'+esc(m.content).replace(/\n/g,'<br>')+'</div></div>';
  return '<div class="msg a"><div class="mm"><b>khanhOS</b><span>·</span><span>'+esc(mL(m.model).toUpperCase())+'</span>'+
  '<span class="acts"><button class="ma" data-act="copy" title="Chép">'+ic('copy')+'</button></span></div>'+
  '<div class="md">'+md(m.content)+'</div></div>';
}
function renderConv(){
  const c=conv();
  if(!c||!c.messages.length){$('#msgs').innerHTML=emptyHtml();return}
  $('#msgs').innerHTML=c.messages.map(m=>msgHtml(m)).join('');
  sBott();
}
 $('#msgs').addEventListener('click',e=>{
  const sg=e.target.closest('.sug');
  if(sg){const t=$('#inp');t.value=SUGS[+sg.dataset.sug];grow(t);t.focus();return}
  const cc=e.target.closest('.cc');
  if(cc){const code=cc.closest('.code').querySelector('code').innerText;
    navigator.clipboard.writeText(code).then(()=>{const s=cc.querySelector('span');s.textContent='Đã chép';setTimeout(()=>s.textContent='Chép',1400)});return}
  const a=e.target.closest('.ma');if(!a)return;
  const c=conv();if(!c)return;
  const box=a.closest('.msg'),i=[...$('#msgs').child
