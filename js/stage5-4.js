import { PathEngine } from "./pathEngine.js";
import { dinosaurPathTheme } from "./themes/dinosaurs.js";

const KEY="cmBuild54";
const dinos=["Troodon","Pachycephalosaurus","Carnotaurus","Iguanodon","Allosaurus","Stegosaurus","Raptor","Ankylosaurus","Spinosaurus","Brachiosaurus","T. rex","Triceratops"];
const packDefs=[["Basic Dinosaur Pack","basic","🦖",25000],["Ruby Dinosaur Pack","ruby","◆",75000],["Emerald Dinosaur Pack","emerald","◆",200000],["Sapphire Dinosaur Pack","sapphire","◆",500000]];
const fresh=()=>({started:false,money:0,income:0,packs:0,sorting:0,opened:0,cards:[],path:0,token:false});
let s={...fresh(),...JSON.parse(localStorage.getItem(KEY)||"{}")};
const $=id=>document.getElementById(id);
const save=()=>localStorage.setItem(KEY,JSON.stringify(s));

let activePathTheme=dinosaurPathTheme;
let pathEngine=null;
let parallaxFrame=0;

function updatePathParallax(){
  cancelAnimationFrame(parallaxFrame);
  parallaxFrame=requestAnimationFrame(()=>pathEngine?.updateParallax($("pathScroll")));
}

function modal(html,canClose=true){
  $("modalContent").innerHTML=html;
  $("modal").classList.remove("hidden");
  $("close").style.display=canClose?"block":"none";
}
$("close").onclick=()=>$("modal").classList.add("hidden");

function currentPathNode(){return Math.max(1,Math.min(activePathTheme.nodeCount,Number(s.path)||1));}

function go(v){
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.view===v));
  document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x.id==="view-"+v));
  const active=document.getElementById("view-"+v);
  if(v==="path"){
    setTimeout(()=>{scrollPathToCurrent(true); updatePathParallax();},70);
  }else if(active){
    active.scrollTop=0;active.scrollLeft=0;
  }
}
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>go(b.dataset.view));
document.querySelectorAll("[data-jump]").forEach(b=>b.onclick=()=>go(b.dataset.jump));
$("pathScroll")?.addEventListener("scroll", updatePathParallax, {passive:true});

function buildPath(theme){
  activePathTheme=theme;
  $("pathTitle").textContent=theme.title;
  $("pathDescription").textContent=theme.description;
  pathEngine=new PathEngine({
    theme,
    board:$("longPathBoard"),
    regionsEl:$("pathRegions"),
    nodesEl:$("pathNodes"),
    svgEl:$("longPathSvg"),
    tokenEl:$("pathToken"),
    onNodeClick:null
  });
  pathEngine.build();
  render();
  setTimeout(updatePathParallax, 20);
}

function scrollPathToCurrent(smooth=true){
  const scroller=$("pathScroll"), node=$(`pathNode${currentPathNode()}`);
  if(!scroller||!node)return;
  const sr=scroller.getBoundingClientRect(), nr=node.getBoundingClientRect();
  const delta=nr.top-sr.top-(scroller.clientHeight/2)+(nr.height/2);
  scroller.scrollTo({top:Math.max(0,scroller.scrollTop+delta),behavior:smooth?"smooth":"auto"});
}

function render(){
  const unique=new Set(s.cards).size;
  $("money").textContent="$"+Math.floor(s.money).toLocaleString();
  $("income").textContent="$"+s.income+" / sec";
  $("pathMoney").textContent="$"+Math.floor(s.money).toLocaleString();
  $("pathIncome").textContent="$"+s.income+" / sec";
  $("packHome").textContent=`${s.packs} / 10`;
  $("sortHome").textContent=`${s.sorting} / 40`;
  $("packCount").textContent=`${s.packs} / 10`;
  $("sortCount").textContent=`${s.sorting} / 40`;
  $("binderStatus").textContent=`${unique} discovered`;
  $("collectionStatus").textContent=`${unique} / 84`;
  $("pathCardsLive").textContent=`${unique} / 84`;
  $("pathMilestonesLive").textContent=`${s.path} / ${activePathTheme.nodeCount}`;
  $("pathCurrentLive").textContent=`NODE ${currentPathNode()}`;
  $("start").style.display=s.started?"none":"inline-block";
  pathEngine?.updateProgress(currentPathNode(),s.token);
  renderBook();
}

function renderBook(){
  if(!s.cards.length){$("bookCards").innerHTML="Your Book is empty.<br>Open a Starter Pack.";return}
  $("bookCards").innerHTML=[...new Set(s.cards)].map(n=>`<div style="background:#252525;color:white;padding:12px;margin:8px;border-radius:8px"><b>${n}</b><br><small>Basic 1/5</small></div>`).join("");
}

$("start").onclick=()=>{
  s.started=true;s.packs=2;save();render();
  modal(`<h2>Your first packs are waiting.</h2><div class="starter"><button id="p1" class="pack">📦</button><div class="pack">📦</div></div><p>Open Starter Pack #1.</p>`,false);
  setTimeout(()=>$("p1").onclick=()=>openStarter(1),0);
};

function openStarter(num){
  const pulls=Array.from({length:4},()=>dinos[Math.floor(Math.random()*dinos.length)]);let i=0;
  function next(){
    if(i<4){
      const n=pulls[i++];
      modal(`<div class="reveal"><div><div style="font-size:60px">🦖</div><h3>${n}</h3><p>BASIC</p></div></div><button id="flick" class="modalAction">FLICK CARD →</button>`,false);
      $("flick").onclick=()=>{s.cards.push(n);s.sorting++;s.income+=4;save();next()};
    }else if(num===1){
      modal(`<div class="reveal"><div><div class="tok">CM</div><h3>THE COLLECTOR</h3><p>STARTER TOKEN</p></div></div><button id="equip" class="modalAction">EQUIP TOKEN</button>`,false);
      $("equip").onclick=()=>{s.token=true;s.opened=1;save();render();modal(`<h2>Token Equipped!</h2><button id="p2" class="modalAction">OPEN STARTER PACK #2</button>`,false);$("p2").onclick=()=>openStarter(2)};
    }else{
      s.packs=0;s.opened=2;s.path=1;save();render();
      modal(`<h2>You're collecting!</h2><p>Your first cards are waiting on the Sorting Table.</p><button id="tableGo" class="modalAction">GO TO TABLE</button>`);
      $("tableGo").onclick=()=>{$("modal").classList.add("hidden");go("table")};
    }
  }
  next();
}

$("deskPacks").onclick=()=>go("table");
$("deskSort").onclick=()=>go("table");
$("deskBook").onclick=()=>go("table");
$("deskToken").onclick=()=>go("tokens");
$("binder").onclick=()=>go("table");
$("collectionDino").onclick=()=>go("table");

$("sortAll").onclick=()=>{
  if(!s.sorting)return modal("<h2>Nothing to sort.</h2>");
  s.sorting=0;save();render();
  modal("<h2>Routine cards sorted.</h2><p>NEW and 5/5 MAX cards will require manual placement later.</p>");
};
$("openPack").onclick=()=>{
  if(s.opened<2)openStarter(s.opened===0?1:2);
  else modal("<h2>Purchased-pack opening comes next.</h2>");
};

function spawn(){
  if(!s.started)return;
  const [name,cls,sym,price]=packDefs[Math.floor(Math.random()*packDefs.length)];
  const p=document.createElement("button");p.className=`moving-pack ${cls}`;p.textContent=sym;$("belt").appendChild(p);
  p.onclick=()=>{
    p.style.animationPlayState="paused";
    modal(`<h2>${name}</h2><div class="pack" style="margin:20px auto">${sym}</div><h3>$${price.toLocaleString()}</h3><button id="buy" class="modalAction">BUY PACK</button><button id="return" class="modalAction" style="margin-top:8px;background:#444;color:white">RETURN TO BELT</button>`);
    $("buy").onclick=()=>{if(s.packs>=10)return modal("<h2>Pack pile full.</h2>");if(s.money<price)return modal("<h2>Not enough money yet.</h2>");s.money-=price;s.packs++;p.remove();save();render();$("modal").classList.add("hidden")};
    $("return").onclick=()=>{$("modal").classList.add("hidden");p.style.animationPlayState="running"};
  };
  setTimeout(()=>p.remove(),30500);
}
setInterval(spawn,10000);setTimeout(spawn,1500);
setInterval(()=>{if(s.started&&s.income){s.money+=s.income;save();render()}},1000);

$("restart").onclick=()=>{if(confirm("RESTART Collection Master? This clears the local test save.")){localStorage.removeItem(KEY);location.reload()}};

window.addEventListener("resize",()=>{if(pathEngine){buildPath(activePathTheme);setTimeout(()=>{scrollPathToCurrent(false);updatePathParallax();},40)}});

buildPath(dinosaurPathTheme);
