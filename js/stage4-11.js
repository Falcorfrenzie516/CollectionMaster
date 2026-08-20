const KEY="cmStage411";const dinos=["Troodon","Pachycephalosaurus","Carnotaurus","Iguanodon","Allosaurus","Stegosaurus","Raptor","Ankylosaurus","Spinosaurus","Brachiosaurus","T. rex","Triceratops"];const packDefs=[["Basic Dinosaur Pack","basic","🦖",25000],["Ruby Dinosaur Pack","ruby","◆",75000],["Emerald Dinosaur Pack","emerald","◆",200000],["Sapphire Dinosaur Pack","sapphire","◆",500000]];const fresh=()=>({started:false,money:0,income:0,packs:0,sorting:0,opened:0,cards:[],path:0,token:false});let s={...fresh(),...JSON.parse(localStorage.getItem(KEY)||"{}")};const $=x=>document.getElementById(x),save=()=>localStorage.setItem(KEY,JSON.stringify(s));function go(v){
document.body.classList.toggle("home-mode",v==="home");
document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.view===v));
document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x.id==="view-"+v));
const active=document.getElementById("view-"+v);
if(v==="path"){
  setTimeout(()=>scrollPathToCurrent(true),60);
}else if(active){
  active.scrollTop=0;
  active.scrollLeft=0;
}
window.scrollTo(0,0)
}document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>go(b.dataset.view));document.querySelectorAll("[data-jump]").forEach(b=>b.onclick=()=>go(b.dataset.jump));

const PATH_REGIONS=[
 {name:"ANCIENT FOREST",sub:"dense cycads, towering trunks, misty canopy",landmark:"FERN GATE"},
 {name:"FERN PLAINS",sub:"open fern fields, shallow creeks, distant tree line",landmark:"OLD CROSSING"},
 {name:"ROCKY HIGHLANDS",sub:"weathered stone, cliff ledges, mountain haze",landmark:"HIGH RIDGE"},
 {name:"PREHISTORIC WETLANDS",sub:"dark water, reed beds, fallen timber",landmark:"MARSH CAMP"},
 {name:"LUSH VALLEY",sub:"broad valley, layered foliage, warm light",landmark:"VALLEY OVERLOOK"},
 {name:"PREDATOR TERRITORY",sub:"dry earth, broken stone, dramatic horizon",landmark:"FINAL HUNT"}
];

const PATH_REWARD_TYPES={
  3:"pack",6:"cash",9:"milestone",
  12:"pack",15:"special",18:"milestone",
  21:"cash",24:"expedition",27:"milestone",
  30:"pack",33:"cash",36:"milestone",
  39:"special",42:"pack",45:"milestone",
  48:"cash",51:"special",54:"milestone"
};

function currentPathNode(){
  return Math.max(1,Math.min(54,Number(s.path)||1));
}

function pathNodePosition(node){
  const index=node-1;
  const region=Math.floor(index/9);
  const within=index%9;

  // One continuous snake: left→right row, right→left row, left→right row.
  const pattern=[
    [23,9],[50,15],[76,10],
    [78,39],[51,45],[23,39],
    [25,70],[50,77],[76,70]
  ];

  const [x,localY]=pattern[within];
  const regionHeight=900;
  const y=(region*regionHeight)+(localY/100*regionHeight);
  return {x,y,region};
}

function buildLongPath(){
  const board=document.getElementById("longPathBoard");
  const regions=document.getElementById("pathRegions");
  const nodes=document.getElementById("pathNodes");
  const svg=document.getElementById("longPathSvg");
  if(!board||!regions||!nodes||!svg)return;

  regions.innerHTML="";
  nodes.innerHTML="";
  svg.innerHTML="";

  PATH_REGIONS.forEach((region,i)=>{
    const el=document.createElement("section");
    el.className="path-region";
    el.dataset.region=i;
    el.style.top=`${i*900}px`;
    el.innerHTML=`
      <div class="region-haze"></div>
      <div class="region-depth depth-a"></div>
      <div class="region-depth depth-b"></div>
      <div class="terrain river"></div>
      <div class="terrain ridge"></div>
      <div class="terrain foliage-a"></div>
      <div class="terrain foliage-b"></div>
      <div class="region-title">
        <span class="region-number">REGION ${i+1}</span>
        <strong>${region.name}</strong>
        <small>${region.sub}</small>
      </div>
      <div class="region-landmark">${region.landmark}</div>`;
    regions.appendChild(el);
  });

  const pts=[];
  for(let node=1;node<=54;node++){
    const pos=pathNodePosition(node);
    pts.push([pos.x/100*1040,pos.y]);

    const b=document.createElement("button");
    b.className="long-node";
    b.id=`pathNode${node}`;
    b.dataset.node=node;
    b.textContent=node;
    b.style.left=`${pos.x}%`;
    b.style.top=`${pos.y}px`;

    const reward=PATH_REWARD_TYPES[node];
    if(reward)b.classList.add(`reward-${reward}`);

    b.onclick=()=>showPathNode(node);
    nodes.appendChild(b);
  }

  let d=`M ${pts[0][0]} ${pts[0][1]}`;
  for(let i=1;i<pts.length;i++){
    const [x0,y0]=pts[i-1], [x1,y1]=pts[i];
    const dy=(y1-y0)*.55;
    d+=` C ${x0} ${y0+dy}, ${x1} ${y1-dy}, ${x1} ${y1}`;
  }

  ["route-shadow","route-main","route-inner"].forEach(cls=>{
    const p=document.createElementNS("http://www.w3.org/2000/svg","path");
    p.setAttribute("d",d);
    p.setAttribute("class",cls);
    svg.appendChild(p);
  });

  updatePathVisuals();
}

function updatePathVisuals(){
  const current=currentPathNode();
  document.querySelectorAll(".long-node").forEach(node=>{
    const n=Number(node.dataset.node);
    node.classList.toggle("completed",n<current);
    node.classList.toggle("current",n===current);
  });

  const pos=pathNodePosition(current);
  const token=document.getElementById("pathToken");
  if(token){
    token.style.left=`calc(${pos.x}% + 58px)`;
    token.style.top=`${pos.y}px`;
    token.style.opacity=s.token?1:.38;
  }

  const currentLabel=document.getElementById("pathCurrentLive");
  if(currentLabel)currentLabel.textContent=`NODE ${current}`;
}

function scrollPathToCurrent(smooth=true){
  const scroller=document.getElementById("pathScroll");
  const node=document.getElementById(`pathNode${currentPathNode()}`);
  if(!scroller||!node)return;

  // The Path header lives above the board. Scroll the current node to the visual center.
  const scrollerRect=scroller.getBoundingClientRect();
  const nodeRect=node.getBoundingClientRect();
  const delta=nodeRect.top-scrollerRect.top-(scroller.clientHeight/2)+(nodeRect.height/2);

  scroller.scrollTo({
    top:Math.max(0,scroller.scrollTop+delta),
    behavior:smooth?"smooth":"auto"
  });
}

function showPathNode(node){
  const reward=PATH_REWARD_TYPES[node];
  const rewardText={
    pack:"Pack reward",
    cash:"Cash reward",
    special:"Special reward",
    expedition:"Expedition unlock",
    milestone:"Major milestone reward"
  }[reward]||"Travel node";

  modal(`
    <p style="color:#9bcf68;font-size:.7rem;letter-spacing:.16em;font-weight:900">DINOSAURS PATH</p>
    <h2>Node ${node}</h2>
    <p>${rewardText}</p>
    <p style="color:#a9b0b3">Current prototype node — reward logic will plug into this node later.</p>
  `);
}

function render(){const u=new Set(s.cards).size;$("money").textContent="$"+Math.floor(s.money).toLocaleString();$("income").textContent="$"+s.income+" / sec";$("packHome").textContent=`${s.packs} / 10`;$("sortHome").textContent=`${s.sorting} / 40`;$("packCount").textContent=`${s.packs} / 10`;$("sortCount").textContent=`${s.sorting} / 40`;$("pathProgress").textContent=`${s.path} / 54`;
const pm=document.getElementById("pathMoney");if(pm)pm.textContent="$"+Math.floor(s.money).toLocaleString();
const pi=document.getElementById("pathIncome");if(pi)pi.textContent="$"+s.income+" / sec";
const pc=document.getElementById("pathCardsLive");if(pc)pc.textContent=`${u} / 84`;
const pml=document.getElementById("pathMilestonesLive");if(pml)pml.textContent=`${s.path} / 54`;$("discovery").textContent=`${u} / 84`;$("binderStatus").textContent=`${u} discovered`;$("collectionStatus").textContent=`${u} / 84`;$("start").style.display=s.started?"none":"inline-block";$("pathToken").style.opacity=s.token?1:.35;$("homeToken").style.opacity=s.token?1:.35;renderBook();updatePathVisuals()}
function renderBook(){if(!s.cards.length){$("bookCards").innerHTML="Your Book is empty.<br>Open a Starter Pack.";return}$("bookCards").innerHTML=[...new Set(s.cards)].map(n=>`<div style="background:#252525;color:white;padding:12px;margin:8px;border-radius:8px"><b>${n}</b><br><small>Basic 1/5</small></div>`).join("")}
function modal(h,c=true){$("modalContent").innerHTML=h;$("modal").classList.remove("hidden");$("close").style.display=c?"block":"none"}$("close").onclick=()=>$("modal").classList.add("hidden");
$("start").onclick=()=>{s.started=true;s.packs=2;save();render();modal(`<h2>Your first packs are waiting.</h2><div class="starter"><button id="p1" class="pack">📦</button><div class="pack">📦</div></div><p>Open Starter Pack #1.</p>`,false);setTimeout(()=>$("p1").onclick=()=>openStarter(1),0)};
function openStarter(num){const pulls=Array.from({length:4},()=>dinos[Math.floor(Math.random()*dinos.length)]);let i=0;function next(){if(i<4){const n=pulls[i++];modal(`<div class="reveal"><div><div style="font-size:60px">🦖</div><h3>${n}</h3><p>BASIC</p></div></div><button id="flick" class="modalAction">FLICK CARD →</button>`,false);$("flick").onclick=()=>{s.cards.push(n);s.sorting++;s.income+=4;save();next()}}else if(num===1){modal(`<div class="reveal"><div><div class="tok">CM</div><h3>THE COLLECTOR</h3><p>STARTER TOKEN</p></div></div><button id="equip" class="modalAction">EQUIP TOKEN</button>`,false);$("equip").onclick=()=>{s.token=true;s.opened=1;save();render();modal(`<h2>Token Equipped!</h2><button id="p2" class="modalAction">OPEN STARTER PACK #2</button>`,false);$("p2").onclick=()=>openStarter(2)}}else{s.packs=0;s.opened=2;s.path=1;save();render();modal(`<h2>You're collecting!</h2><p>Your first cards are waiting on the Sorting Table.</p><button id="tableGo" class="modalAction">GO TO TABLE</button>`);$("tableGo").onclick=()=>{$("modal").classList.add("hidden");go("table")}}}next()}
$("deskPacks").onclick=()=>go("table");$("deskSort").onclick=()=>go("table");$("deskBook").onclick=()=>go("table");$("deskToken").onclick=()=>go("tokens");$("binder").onclick=()=>go("table");$("collectionDino").onclick=()=>go("table");
$("sortAll").onclick=()=>{if(!s.sorting)return modal("<h2>Nothing to sort.</h2>");s.sorting=0;save();render();modal("<h2>Routine cards sorted.</h2><p>NEW and 5/5 MAX cards will require manual placement later.</p>")};
$("openPack").onclick=()=>{if(s.opened<2)openStarter(s.opened===0?1:2);else modal("<h2>Purchased-pack opening comes next.</h2><p>The room and navigation are now ready for that system.</p>")};
function spawn(){if(!s.started)return;const [name,cls,sym,price]=packDefs[Math.floor(Math.random()*packDefs.length)],p=document.createElement("button");p.className=`moving-pack ${cls}`;p.textContent=sym;$("belt").appendChild(p);p.onclick=()=>{p.style.animationPlayState="paused";modal(`<h2>${name}</h2><div class="pack" style="margin:20px auto">${sym}</div><h3>$${price.toLocaleString()}</h3><button id="buy" class="modalAction">BUY PACK</button><button id="return" class="modalAction" style="margin-top:8px;background:#444;color:white">RETURN TO BELT</button>`);$("buy").onclick=()=>{if(s.packs>=10)return modal("<h2>Pack pile full.</h2>");if(s.money<price)return modal("<h2>Not enough money yet.</h2>");s.money-=price;s.packs++;p.remove();save();render();$("modal").classList.add("hidden")};$("return").onclick=()=>{$("modal").classList.add("hidden");p.style.animationPlayState="running"}};setTimeout(()=>p.remove(),30500)}setInterval(spawn,10000);setTimeout(spawn,1500);setInterval(()=>{if(s.started&&s.income){s.money+=s.income;save();render()}},1000);$("restart").onclick=()=>{if(confirm("RESTART Collection Master? This clears the local test save.")){localStorage.removeItem(KEY);location.reload()}};buildLongPath();render();
// 4.10 initial viewport mode
document.body.classList.toggle("home-mode",document.getElementById("view-home").classList.contains("active"));
