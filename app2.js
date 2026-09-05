/* khanhOS — app2.js · PHẦN 2/2: giao diện + chat + thanh toán
   Dòng cuối của file này PHẢI là dòng "✓ HẾT PHẦN 2" — nếu không thấy nghĩa là bị cắt, dán lại. */

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
 if(st===404)return 'Không có /api/chat trên host này (GitHub Pages chỉ host tĩnh). Deploy lên Vercel với biến CEREBRAS_API_KEY, hoặc mở Cài đặt nhập key riêng.';
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
 '<div class="f"><label>API key Cerebras (tuỳ chọn)</label><input id="sk" type="password" placeholder="csk-…" value="'+esc(dat.key)+'"/></div>'+
 '<button class="tag" id="kb" type="button" style="margin-bottom:14px">Kiểm tra key</button>'+
 '<div class="f"><label>System prompt (gói MAX'+(own()?' · OWNER':'')+')'+(syOK?'':' — khoá')+'</label><textarea id="sy" class="ta" rows="4" placeholder="'+esc(SYS)+'"'+(syOK?'':' disabled')+'>'+esc(dat.sys)+'</textarea></div>'+
 '<button class="btn" id="sv" type="button">Lưu cài đặt</button>');
 $('#kb').onclick=function(){
  var k=$('#sk').value.trim();if(!k){toast('Nhập key trước đã','warn');return}
  fetch(APIM,{headers:{Authorization:'Bearer '+k}}).then(function(r){if(!r.ok)throw 0;return r.json()})
   .then(function(d){toast('Key hợp lệ — '+(d.data?d.data.length:'?')+' model khả dụng','ok')})
   .catch(function(){toast('Key không hợp lệ hoặc bị chặn CORS','warn')});
 };
 $('#sv').onclick=function(){
  dat.key=$('#sk').value.trim();
  if(syOK)dat.sys=$('#sy').value.trim();
  save();toast('Đã lưu cài đặt','ok');mC();
 };
}
function mWelcome(){
 mO('<h3>Chào mừng đến khanhOS</h3><p class="ms">Trợ lý AI chạy trên hạ tầng Cerebras — trả lời gần như tức thời.</p>'+
 '<div class="ph"><div class="t">3 bước bắt đầu</div><div class="m"><b>01</b> Gõ câu hỏi dưới cùng rồi Enter<br><b>02</b> Hết 10k token/ngày? Mở «Gói — quản lý» để nâng PLUS · MAX<br><b>03</b> Tự có key Cerebras? Dán vào Cài đặt để gọi trực tiếp</div><div class="n">Phiên demo — dữ liệu nằm trong localStorage trình duyệt</div></div>'+
 '<button class="btn" id="wb" type="button">Bắt đầu</button>');
 $('#wb').onclick=mC;
}

/* ===== wiring & boot ===== */
 $('#nw').onclick=function(){eC();renderList();renderMsgs();$('#tx').focus();document.body.classList.remove('so')};
 $('#mb').onclick=function(){document.body.classList.toggle('so')};
 $('#ov').onclick=function(){document.body.classList.remove('so')};
 $('#pc').onclick=mPlans;$('#pill').onclick=mPlans;$('#pt').onclick=mPlans;
 $('#st').onclick=mSet;$('#lo').onclick=logout;
 $('#msel').onchange=function(){dat.model=this.value;save()};

 $('#jsfail').hidden=true;
loadU();
ses=store.g(KS);
if(ses&&users[ses])enterApp();

/* ✓ HẾT PHẦN 2 — dòng này PHẢI là dòng cuối cùng của file app2.js */
