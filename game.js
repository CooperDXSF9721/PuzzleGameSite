const $=s=>document.querySelector(s), stage=$('#stage');
let timer=null;
const ROUNDS=5;
const rnd=(a,b)=>a+Math.random()*(b-a);
function best(key,val){try{const k='pgs-'+key;const b=Math.max(+localStorage.getItem(k)||0,val);localStorage.setItem(k,b);return b}catch(e){return val}}

/* ---------- Router ---------- */
const games={color:colorGame,size:sizeGame};
function route(){
  clearInterval(timer);
  const g=games[location.hash.slice(1)];
  $('#menu').hidden=!!g; $('#game').hidden=!g;
  window.scrollTo(0,0);
  if(g)g();
}
addEventListener('hashchange',route);

/* ---------- Color Match ---------- */
function hsl2rgb(h,s,l){s/=100;l/=100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l);
  const f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));
  return[f(0)*255,f(8)*255,f(4)*255]}
const hsl=c=>`hsl(${c[0]},${c[1]}%,${c[2]}%)`;
function colorScore(a,b){const A=hsl2rgb(...a),B=hsl2rgb(...b);
  const d=Math.hypot(A[0]-B[0],A[1]-B[1],A[2]-B[2]);
  return Math.max(0,Math.round(100-d*0.45))}

function colorGame(){
  let round=0,total=0,target;
  stage.innerHTML=`<h1>Color Match</h1>
    <p class="muted">A color shows for 3 seconds. Then use the sliders to recreate it. ${ROUNDS} rounds, up to ${ROUNDS*100} points.</p>
    <button id="go">Start</button>`;
  $('#go').onclick=next;
  function next(){
    round++;
    target=[Math.round(rnd(0,360)),Math.round(rnd(30,100)),Math.round(rnd(25,80))];
    stage.innerHTML=`<p class="muted center">Round ${round} of ${ROUNDS}. Remember this color.</p>
      <div class="swatch" style="background:${hsl(target)}"></div><p class="big center" id="t">3</p>`;
    let n=3;
    timer=setInterval(()=>{n--;if(n<=0){clearInterval(timer);guess()}else $('#t').textContent=n},1000);
  }
  function guess(){
    stage.innerHTML=`<p class="muted center">Round ${round} of ${ROUNDS}. Match the color you saw.</p>
      <div class="swatch" id="sw"></div>
      <div class="slider"><label for="h">Hue</label><input id="h" type="range" min="0" max="360" value="180"></div>
      <div class="slider"><label for="s">Saturation</label><input id="s" type="range" min="0" max="100" value="50"></div>
      <div class="slider"><label for="l">Lightness</label><input id="l" type="range" min="0" max="100" value="50"></div>
      <div class="center"><button id="ok">Submit</button></div>`;
    const get=()=>[+$('#h').value,+$('#s').value,+$('#l').value];
    const upd=()=>$('#sw').style.background=hsl(get());
    ['h','s','l'].forEach(i=>$('#'+i).oninput=upd);upd();
    $('#ok').onclick=()=>result(get());
  }
  function result(g){
    const sc=colorScore(target,g);total+=sc;
    const last=round>=ROUNDS;
    stage.innerHTML=`<div class="center"><div class="score">${sc} / 100</div>
      <p class="muted">Round ${round} of ${ROUNDS}. Total: ${total}</p></div>
      <div class="pair"><div><div class="swatch" style="background:${hsl(target)}"></div><p class="center muted">Target</p></div>
      <div><div class="swatch" style="background:${hsl(g)}"></div><p class="center muted">Yours</p></div></div>
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
/* [name, emoji, longest dimension in meters, roughly] */
const THINGS=[
 ["Paperclip","📎",.03],["Key","🔑",.06],["Apple","🍎",.08],["Tennis ball","🎾",.067],["Coffee mug","☕",.1],
 ["Smartphone","📱",.15],["Scissors","✂️",.17],["Banana","🍌",.18],["Pencil","✏️",.19],["Toothbrush","🪥",.18],
 ["Soccer ball","⚽",.22],["Book","📖",.23],["Basketball","🏀",.24],["Watermelon","🍉",.25],["Laptop","💻",.33],
 ["Hammer","🔨",.33],["Pizza","🍕",.35],["Chair","🪑",.9],["Guitar","🎸",1],["Umbrella","☂️",1],
 ["Door","🚪",2],["Ladder","🪜",2],["Bed","🛏️",2],["Couch","🛋️",2],["Piano","🎹",1.5],
 ["Bicycle","🚲",1.7],["Car","🚗",4.5],["Sailboat","⛵",10],["School bus","🚌",12],["Airplane (737)","✈️",39],
 ["Rocket (Saturn V)","🚀",110],["Eiffel Tower","🗼",330],["Statue of Liberty","🗽",93],
 ["Ant","🐜",.005],["Bee","🐝",.015],["Butterfly","🦋",.07],["Mouse","🐭",.08],["Crab","🦀",.2],
 ["Cat","🐈",.46],["Rabbit","🐇",.4],["Dog","🐕",.6],["Penguin","🐧",1.1],["Horse","🐎",2.4],
 ["Human adult","🧍",1.7],["Snake (python)","🐍",3],["Elephant","🐘",3.2],["Hippo","🦛",3.5],["Great white shark","🦈",4.5],
 ["Giraffe","🦒",5.5],["Blue whale","🐋",25],
 ["T. rex","🦖",12],["Velociraptor","🦖",2],["Triceratops","🦖",9],["Stegosaurus","🦕",7],["Brontosaurus","🦕",22],
 ["Santa Claus","🎅",1.8],["Vampire (Dracula)","🧛",1.8],["Mermaid","🧜",1.7],["Unicorn","🦄",1.6],["Fairy (Tinker Bell)","🧚",.15],
 ["Genie","🧞",2],["Wizard (Gandalf)","🧙",1.8],["Alien","👽",1.5],["Robot","🤖",1.8],["Ghost","👻",1.7],
 ["Snowman","⛄",1.5],["King Kong (1933)","🦍",7.5],["Godzilla (1954)","🦖",50]
];
function fmt(m){
  if(m>=1000)return (m/1000)+" km";
  if(m>=1)return (+m.toPrecision(3))+" m";
  if(m>=.01)return (+(m*100).toPrecision(3))+" cm";
  return (+(m*1000).toPrecision(3))+" mm";
}
function sizeGame(){
  let round=0,total=0,used=new Set();
  const cap=Math.max(90,Math.min(240,(innerWidth-110)/2.3)),MIN=5;
  stage.innerHTML=`<h1>Size Match</h1>
    <p class="muted">Two things appear. One stays the same size. Drag the slider to resize the other so the two match their real-life size difference. Sizes use each item’s longest side. ${ROUNDS} rounds, up to ${ROUNDS*100} points.</p>
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
  const item=(t,px,label)=>`<div class="item"><span class="e" style="font-size:${px}px">${t[1]}</span><div class="n">${label}</div></div>`;
  function guess(a,b,r,F,T){
    stage.innerHTML=`<p class="muted center">Round ${round} of ${ROUNDS}. Resize the ${b[0]} to match the real-life scale next to the ${a[0]}.</p>
      <div class="stage"><div class="item"><span class="e" style="font-size:${F}px">${a[1]}</span><div class="n">${a[0]} (fixed)</div></div>
      <div class="item"><span class="e" id="mv">${b[1]}</span><div class="n">${b[0]}</div></div></div>
      <input id="sl" type="range" min="0" max="1000" value="500" style="width:100%;accent-color:#1a1a1a" aria-label="Size of ${b[0]}">
      <div class="center"><button id="ok">Submit</button></div>`;
    const px=()=>MIN*Math.pow(cap*1.15/MIN,$('#sl').value/1000);
    const upd=()=>$('#mv').style.fontSize=px()+'px';
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
      <p class="center">${a[0]}: about ${fmt(a[2])}. ${b[0]}: about ${fmt(b[2])}.<br>The ${b[0]} is ${rel}. You were off by ${(+off.toPrecision(2))}×.</p>
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

route();
