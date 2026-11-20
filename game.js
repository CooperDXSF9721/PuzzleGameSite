const $=s=>document.querySelector(s), stage=$('#stage');
let timer=null;
const ROUNDS=5;
const rnd=(a,b)=>a+Math.random()*(b-a);
function best(key,val){try{const k='pgs-'+key;const b=Math.max(+localStorage.getItem(k)||0,val);localStorage.setItem(k,b);return b}catch(e){return val}}

/* ---------- Router ---------- */
const games={color:colorGame,size:sizeGame,memory:memoryGame,count:countGame};
function route(){
  clearInterval(timer);
  const g=games[location.hash.slice(1)];
  $('#menu').hidden=!!g; $('#game').hidden=!g;
  window.scrollTo(0,0);
  if(g)g();
}
addEventListener('hashchange',route);

/* ---------- Color Match ---------- */
function hsv2rgb(h,s,v){const f=n=>{const k=(n+h/60)%6;return (v-v*s*Math.max(0,Math.min(k,4-k,1)))*255};return[f(5),f(3),f(1)]}
const rgbCss=c=>`rgb(${c.map(Math.round).join(',')})`;
function colorScore(a,b){const d=Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);return Math.max(0,Math.round(100-d*0.45))}

function drawWheel(cv){
  const S=cv.width,R=S/2,ctx=cv.getContext('2d'),img=ctx.createImageData(S,S);
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
    const dx=x+.5-R,dy=y+.5-R,r=Math.hypot(dx,dy),i=(y*S+x)*4;
    if(r>R)continue;
    const h=(Math.atan2(dy,dx)*180/Math.PI+360)%360,c=hsv2rgb(h,r/R,1);
    img.data[i]=c[0];img.data[i+1]=c[1];img.data[i+2]=c[2];img.data[i+3]=r>R-1?255*(R-r):255;
  }
  ctx.putImageData(img,0,0);
}

function colorGame(){
  let round=0,total=0,target;
  stage.innerHTML=`<h1>Color Match</h1>
    <p class="muted">A color shows for 3 seconds. Then pick it from memory on the color wheel: drag the dot to choose the color, and use the brightness slider to make it lighter or darker. ${ROUNDS} rounds, up to ${ROUNDS*100} points.</p>
    <button id="go">Start</button>`;
  $('#go').onclick=next;
  function next(){
    round++;
    target=[hsv2rgb(rnd(0,360),rnd(.35,1),rnd(.35,1))];
    target=target[0];
    stage.innerHTML=`<p class="muted center">Round ${round} of ${ROUNDS}. Remember this color.</p>
      <div class="swatch" style="background:${rgbCss(target)}"></div><p class="big center" id="t">3</p>`;
    let n=3;
    timer=setInterval(()=>{n--;if(n<=0){clearInterval(timer);guess()}else $('#t').textContent=n},1000);
  }
  function guess(){
    stage.innerHTML=`<p class="muted center">Round ${round} of ${ROUNDS}. Pick the color you saw.</p>
      <div class="picker">
        <div class="wheel" id="wheel"><canvas width="240" height="240"></canvas><div class="shade" id="shade"></div><div class="dot" id="dot"></div></div>
        <div class="bright"><label for="v">Brightness</label><input id="v" type="range" min="0" max="100" value="100"></div>
        <div class="preview" id="pv"></div>
      </div>
      <div class="center"><button id="ok">Submit</button></div>`;
    drawWheel($('#wheel canvas'));
    let H=0,Sat=0,V=1;
    const cur=()=>hsv2rgb(H,Sat,V);
    function upd(){
      const R=120,a=H*Math.PI/180;
      const d=$('#dot');d.style.left=(R+Math.cos(a)*Sat*R)+'px';d.style.top=(R+Math.sin(a)*Sat*R)+'px';
      d.style.background=rgbCss(cur());
      $('#shade').style.opacity=1-V;
      $('#v').style.background=`linear-gradient(to right,#000,${rgbCss(hsv2rgb(H,Sat,1))})`;
      $('#pv').style.background=rgbCss(cur());
    }
    const w=$('#wheel');
    function move(e){
      const b=w.getBoundingClientRect(),k=240/b.width;
      const dx=(e.clientX-b.left-b.width/2)*k,dy=(e.clientY-b.top-b.height/2)*k;
      H=(Math.atan2(dy,dx)*180/Math.PI+360)%360;Sat=Math.min(1,Math.hypot(dx,dy)/120);upd();
    }
    w.onpointerdown=e=>{w.setPointerCapture(e.pointerId);move(e)};
    w.onpointermove=e=>{if(w.hasPointerCapture(e.pointerId))move(e)};
    $('#v').oninput=e=>{V=e.target.value/100;upd()};
    upd();
    $('#ok').onclick=()=>result(cur());
  }
  function result(g){
    const sc=colorScore(target,g);total+=sc;
    const last=round>=ROUNDS;
    stage.innerHTML=`<div class="center"><div class="score">${sc} / 100</div>
      <p class="muted">Round ${round} of ${ROUNDS}. Total: ${total}</p></div>
      <div class="pair"><div><div class="swatch" style="background:${rgbCss(target)}"></div><p class="center muted">Target</p></div>
      <div><div class="swatch" style="background:${rgbCss(g)}"></div><p class="center muted">Yours</p></div></div>
      <div class="center"><button id="nx">${last?'See final score':'Next round'}</button></div>`;
    $('#nx').onclick=last?end:next;
  }
  function end(){
    const b=best('color',total);
    stage.innerHTML=`<div class="center"><h1>Final score</h1><div class="score">${total} / ${ROUNDS*100}</div>
      <p class="muted">Your best: ${b}</p>
      <button id="again">Play again</button> <button class="alt" onclick="location.hash=''">All games</button></div>`;
    $('#again').onclick=colorGame;
  }
}

/* ---------- Size Match ---------- */
/* [name, emoji, size in meters, what is measured]. Sizes are typical or canon values. */
const THINGS=[
 ["Paperclip","📎",.033,"length"],["House key","🔑",.06,"length"],["Tennis ball","🎾",.067,"diameter"],["Apple","🍎",.08,"diameter"],
 ["Coffee cup","☕",.095,"height"],["Smartphone","📱",.15,"height"],["Toothbrush","🪥",.18,"length"],["Scissors","✂️",.18,"length"],
 ["Banana","🍌",.19,"length"],["Pencil","✏️",.19,"length"],["Soccer ball","⚽",.22,"diameter"],["Hardcover book","📕",.23,"height"],
 ["Basketball","🏀",.24,"diameter"],["Laptop (13–15 in)","💻",.33,"width"],["Hammer","🔨",.33,"length"],["Large pizza (14 in)","🍕",.36,"diameter"],
 ["Dining chair","🪑",.9,"height"],["Acoustic guitar","🎸",1,"length"],["Piano keyboard (88 keys)","🎹",1.23,"width"],["Bicycle","🚲",1.75,"length"],
 ["Door","🚪",2.03,"height"],["Queen bed","🛏️",2.03,"length"],["3-seat sofa","🛋️",2.1,"width"],["Car","🚗",4.5,"length"],
 ["School bus","🚌",11,"length"],["Boeing 737","✈️",39.5,"length"],["Giant sequoia (General Sherman)","🌲",83.8,"height"],
 ["Statue of Liberty (to torch)","🗽",93,"height"],["Saturn V rocket","🚀",110.6,"height"],["Eiffel Tower","🗼",330,"height"],
 ["Ant","🐜",.005,"length"],["Honeybee","🐝",.015,"length"],["House mouse","🐭",.08,"length"],["Monarch butterfly","🦋",.095,"wingspan"],
 ["Rabbit","🐇",.4,"length"],["Cat","🐈",.46,"length"],["Labrador","🐕",.57,"height"],["Emperor penguin","🐧",1.2,"height"],
 ["Horse","🐎",1.6,"height"],["Human adult","🧍",1.7,"height"],["Hippo","🦛",3.5,"length"],["African elephant","🐘",3.3,"height"],
 ["Great white shark","🦈",4.5,"length"],["Giraffe","🦒",5.2,"height"],["Blue whale","🐋",25,"length"],
 ["T. rex","🦖",12,"length"],["Velociraptor","🦖",1.8,"length"],["Triceratops","🦖",8.5,"length"],["Brontosaurus","🦕",22,"length"],
 ["Yoda","👽",.66,"height"],["Darth Vader","🥷",2.03,"height"],["Chewbacca","🦍",2.29,"height"],
 ["Godzilla (1954)","🦖",50,"height"],["Godzilla (2014)","🦖",108,"height"]
];
function fmt(m){
  if(m>=1000)return (m/1000)+" km";
  if(m>=1)return (+m.toPrecision(3))+" m";
  if(m>=.01)return (+(m*100).toPrecision(3))+" cm";
  return (+(m*1000).toPrecision(3))+" mm";
}
function sizeGame(){
  let round=0,total=0,used=new Set();
  const cap=Math.max(90,Math.min(220,(innerWidth-120)/2.3)),MIN=5;
  stage.innerHTML=`<h1>Size Match</h1>
    <p class="muted">Two things appear. One stays fixed, and its real size is shown. Drag the slider to resize the other so the two match their real-life size difference. The bracket on each item shows which measurement counts, such as height or length. The emoji are just stand-ins, so go by the label. ${ROUNDS} rounds, up to ${ROUNDS*100} points.</p>
    <button id="go">Start</button>`;
  $('#go').onclick=next;
  function pick(){
    for(;;){
      const a=THINGS[Math.floor(Math.random()*THINGS.length)],b=THINGS[Math.floor(Math.random()*THINGS.length)];
      const r=b[2]/a[2];
      if(a===b||used.has(a[0])||used.has(b[0])||r>15||r<1/15||(r>.9&&r<1.1))continue;
      used.add(a[0]);used.add(b[0]);return[a,b,r];
    }
  }
  function next(){
    round++;
    const[a,b,r]=pick();
    let F,T;
    if(r>1){T=rnd(.6,1)*cap;F=T/r}else{F=rnd(.6,1)*cap;T=F*r}
    guess(a,b,r,F,T);
  }
  /* an item box of px by px, with a bracket along the measured side */
  const box=(t,px,id)=>{
    const v=t[3]==='height',g=`<div class="glyph" ${id?`id="${id}"`:''} style="width:${px}px;height:${px}px;font-size:${px*.8}px">${t[1]}</div>`;
    return v?`<div class="row">${g}<div class="dimv" style="height:${px}px"></div></div>`
            :`<div>${g}<div class="dimh" style="width:${px}px"></div></div>`;
  };
  const item=(t,px,label,id)=>`<div class="item">${box(t,px,id)}<div class="n">${label}</div></div>`;
  function guess(a,b,r,F,T){
    stage.innerHTML=`<p class="muted center">Round ${round} of ${ROUNDS}. Resize the ${b[0]} to match real-life scale next to the ${a[0]}.</p>
      <div class="stage">${item(a,F,`${a[0]} (fixed)<br><strong>${a[3]}: ${fmt(a[2])}</strong>`)}
      ${item(b,60,`${b[0]}<br>${b[3]}`,'mv')}</div>
      <input id="sl" type="range" min="0" max="1000" value="500" style="width:100%;accent-color:#1a1a1a" aria-label="Size of ${b[0]}">
      <div class="center"><button id="ok">Submit</button></div>`;
    const px=()=>MIN*Math.pow(cap*1.15/MIN,$('#sl').value/1000);
    const mv=$('#mv'),dim=mv.parentNode.querySelector('.dimh,.dimv');
    const upd=()=>{const p=px();mv.style.width=mv.style.height=p+'px';mv.style.fontSize=p*.8+'px';
      if(b[3]==='height')dim.style.height=p+'px';else dim.style.width=p+'px'};
    $('#sl').oninput=upd;upd();
    $('#ok').onclick=()=>result(a,b,r,F,T,px());
  }
  function result(a,b,r,F,T,g){
    const err=Math.abs(Math.log(g/T)),sc=Math.max(0,Math.round(100*(1-err/Math.log(4))));
    total+=sc;const off=Math.exp(err),last=round>=ROUNDS;
    const rel=r>=1?`${(+r.toPrecision(2))}× bigger`:`${(+(1/r).toPrecision(2))}× smaller`;
    stage.innerHTML=`<div class="center"><div class="score">${sc} / 100</div>
      <p class="muted">Round ${round} of ${ROUNDS}. Total: ${total}</p></div>
      <div class="stage">${item(a,F,a[0])}${item(b,g,'Your '+b[0])}${item(b,T,'Actual '+b[0])}</div>
      <p class="center">${a[0]} ${a[3]}: about ${fmt(a[2])}.<br>${b[0]} ${b[3]}: about ${fmt(b[2])}.<br>The ${b[0]} is ${rel}. You were off by ${(+off.toPrecision(2))}×.</p>
      <div class="center"><button id="nx">${last?'See final score':'Next round'}</button></div>`;
    $('#nx').onclick=last?end:next;
  }
  function end(){
    const bs=best('size',total);
    stage.innerHTML=`<div class="center"><h1>Final score</h1><div class="score">${total} / ${ROUNDS*100}</div>
      <p class="muted">Your best: ${bs}</p>
      <button id="again">Play again</button> <button class="alt" onclick="location.hash=''">All games</button></div>`;
    $('#again').onclick=sizeGame;
  }
}

/* ---------- Pattern Memory ---------- */
function memoryGame(){
  const PER=3,MAXSTRIKES=3; /* patterns per grid size, strikes allowed */
  let size=2,done=0,score=0,strikes=0,lit,k;
  stage.innerHTML=`<h1>Pattern Memory</h1>
    <p class="muted">A grid flashes some lit squares. Once it goes blank, tap the squares that were lit and submit. Solve ${PER} patterns to move up a grid size, starting at 2×2. Each correct pattern scores one point per lit square. ${MAXSTRIKES} wrong answers ends the game.</p>
    <button id="go">Start</button>`;
  $('#go').onclick=next;
  const status=()=>`<p class="muted center">Grid ${size}×${size}, pattern ${done+1} of ${PER}. Score ${score}. Strikes ${'●'.repeat(strikes)}${'○'.repeat(MAXSTRIKES-strikes)}</p>`;
  const grid=cls=>`<div class="mgrid" style="grid-template-columns:repeat(${size},1fr)">${
    Array.from({length:size*size},(_,i)=>`<button class="cell ${cls(i)}" data-i="${i}" aria-label="Square ${i+1}"></button>`).join('')}</div>`;
  function next(){
    k=Math.max(2,Math.floor(size*size*.4));
    lit=new Set();
    while(lit.size<k)lit.add(Math.floor(Math.random()*size*size));
    stage.innerHTML=status()+`<p class="center"><strong>Memorize the lit squares</strong></p>`+grid(i=>lit.has(i)?'on':'');
    timer=setTimeout(guess,Math.min(4500,1000+400*k));
  }
  function guess(){
    const sel=new Set();
    stage.innerHTML=status()+`<p class="center" id="cnt"></p>`+grid(()=>'')+`<div class="center"><button id="ok">Submit</button></div>`;
    const cnt=()=>$('#cnt').textContent=`Tap the squares that were lit. Selected ${sel.size} of ${k}.`;
    cnt();
    stage.querySelectorAll('.cell').forEach(c=>c.onclick=()=>{
      const i=+c.dataset.i;
      if(sel.has(i)){sel.delete(i);c.classList.remove('sel')}else{sel.add(i);c.classList.add('sel')}
      cnt();
    });
    $('#ok').onclick=()=>result(sel);
  }
  function result(sel){
    const ok=sel.size===k&&[...lit].every(i=>sel.has(i));
    let msg;
    if(ok){score+=k;done++;msg=`Correct! +${k} points.`;
      if(done>=PER){size++;done=0;msg+=` Next up: ${size}×${size}.`}}
    else{strikes++;msg=`Not quite. Strike ${strikes} of ${MAXSTRIKES}.`}
    const over=strikes>=MAXSTRIKES;
    const shown=grid(i=>lit.has(i)?(sel.has(i)?'on':'miss'):(sel.has(i)?'bad':''));
    stage.innerHTML=`<p class="center big">${ok?'✓':'✗'}</p><p class="center">${msg}</p>`+
      shown.replace(/<button/g,'<button disabled')+
      `<p class="center muted legend">Filled: correct. Dashed: missed. Red: wrong pick.</p>
      <div class="center"><button id="nx">${over?'See final score':'Next pattern'}</button></div>`;
    $('#nx').onclick=over?end:next;
  }
  function end(){
    const b=best('memory',score);
    stage.innerHTML=`<div class="center"><h1>Game over</h1><div class="score">${score} points</div>
      <p class="muted">You reached ${size}×${size}. Your best: ${b}</p>
      <button id="again">Play again</button> <button class="alt" onclick="location.hash=''">All games</button></div>`;
    $('#again').onclick=memoryGame;
  }
}

/* ---------- Quick Count ---------- */
function countGame(){
  const MAXSTRIKES=3,PER=3,MAXSIZE=5; /* strikes allowed, flashes per grid size, last grid size */
  const flashMs=()=>300+30*(size-2);   /* flash time in ms: 300 on 2x2, a bit longer on bigger grids */
  let size=2,done=0,round=1,score=0,strikes=0,k=0,last=0,lit=new Set(),finished=false;
  stage.innerHTML=`<h1>Quick Count</h1>
    <p class="muted">Squares light up on a grid for a split second. Count how many were lit and type the number. Every flash has a random number of squares, from 1 up to one less than the whole grid. After ${PER} flashes the grid grows by one size, starting at 2×2 and ending at ${MAXSIZE}×${MAXSIZE}. A correct answer scores the number of lit squares. ${MAXSTRIKES} wrong answers ends the game.</p>
    <button id="go">Start</button>`;
  $('#go').onclick=ready;
  const status=()=>`<p class="muted center">Grid ${size}×${size}, flash ${done+1} of ${PER}. Score ${score}. Strikes ${'●'.repeat(strikes)}${'○'.repeat(MAXSTRIKES-strikes)}</p>`;
  const grid=cls=>`<div class="mgrid" style="grid-template-columns:repeat(${size},1fr)">${
    Array.from({length:size*size},(_,i)=>`<button class="cell ${cls(i)}" disabled aria-label="Square ${i+1}"></button>`).join('')}</div>`;
  function ready(){
    const total=size*size;
    do{k=1+Math.floor(Math.random()*(total-1))}while(k===last);  /* never the same count twice in a row */
    last=k;
    lit=new Set();
    while(lit.size<k)lit.add(Math.floor(Math.random()*total));
    stage.innerHTML=status()+grid(()=>'')+`<p class="center muted">Ready? The squares light up for a split second.</p>
      <div class="center"><button id="fl">Flash</button></div>`;
    $('#fl').onclick=()=>{
      stage.innerHTML=status()+grid(()=>'')+`<p class="center muted">Get ready…</p>`;
      timer=setTimeout(()=>{
        stage.innerHTML=status()+grid(i=>lit.has(i)?'on':'')+`<p class="center muted">&nbsp;</p>`;
        timer=setTimeout(ask,flashMs());
      },700);
    };
  }
  function ask(){
    stage.innerHTML=status()+grid(()=>'')+`<p class="center"><strong>How many squares were lit?</strong></p>
      <div class="center"><input id="num" class="numin" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" autocomplete="off" aria-label="Number of lit squares"></div>
      <div class="center"><button id="ok">Submit</button></div>`;
    const inp=$('#num');inp.focus();
    const go=()=>{if(/^\d+$/.test(inp.value))result(+inp.value)};
    $('#ok').onclick=go;
    inp.onkeydown=e=>{if(e.key==='Enter')go()};
  }
  function result(g){
    const ok=g===k;
    let msg;
    if(ok){score+=k;msg=`Correct! There were ${k}. +${k} points.`}
    else{strikes++;msg=`Not quite. There were ${k} and you said ${g}. Strike ${strikes} of ${MAXSTRIKES}.`}
    const shown=grid(i=>lit.has(i)?'on':'');
    round++;done++;
    if(done>=PER){done=0;if(size<MAXSIZE){size++;msg+=` Next up: ${size}×${size}.`}else{finished=true;msg+=` You cleared the ${MAXSIZE}×${MAXSIZE} grid!`}}
    const over=strikes>=MAXSTRIKES||finished;
    const prev=shown;
    stage.innerHTML=`<p class="center big">${ok?'✓':'✗'}</p><p class="center">${msg}</p>`+prev+
      `<div class="center"><button id="nx">${over?'See final score':'Next flash'}</button></div>`;
    $('#nx').onclick=over?end:ready;
  }
  function end(){
    const b=best('count',score);
    stage.innerHTML=`<div class="center"><h1>${finished?'You finished!':'Game over'}</h1><div class="score">${score} points</div>
      <p class="muted">${finished?`You cleared every grid up to ${MAXSIZE}×${MAXSIZE}.`:`You reached ${size}×${size}.`} Your best: ${b}</p>
      <button id="again">Play again</button> <button class="alt" onclick="location.hash=''">All games</button></div>`;
    $('#again').onclick=countGame;
  }
}

route();
