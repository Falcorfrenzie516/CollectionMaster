const SAVE_KEY="cmVisualV1";
const dinos=["Troodon","Pachycephalosaurus","Carnotaurus","Iguanodon","Allosaurus","Stegosaurus","Raptor","Ankylosaurus","Spinosaurus","Brachiosaurus","T. rex","Triceratops"];
const packTypes=[
  {name:"Basic Dinosaur Pack",className:"pack-basic",symbol:"🦖",price:25000},
  {name:"Ruby Dinosaur Pack",className:"pack-ruby",symbol:"◆",price:75000},
  {name:"Emerald Dinosaur Pack",className:"pack-emerald",symbol:"◆",price:200000},
  {name:"Sapphire Dinosaur Pack",className:"pack-sapphire",symbol:"◆",price:500000}
];

const fresh=()=>({started:false,money:0,income:0,packs:0,sorting:0,openedStarter:0,cards:[],path:0,token:false});
let save={...fresh(),...JSON.parse(localStorage.getItem(SAVE_KEY)||"{}")};
const $=id=>document.getElementById(id);
const persist=()=>localStorage.setItem(SAVE_KEY,JSON.stringify(save));

document.querySelectorAll(".tab").forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
  document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active");
  $("view-"+btn.dataset.view).classList.add("active");
});

function render(){
  $("money").textContent="$"+Math.floor(save.money).toLocaleString();
  $("income").textContent="$"+save.income.toLocaleString()+" / sec";
  $("packCount").textContent=`${save.packs} / 10`;
  $("sortCount").textContent=`${save.sorting} / 40`;
  $("pathProgress").textContent=`${save.path} / 54`;
  $("discovery").textContent=`${new Set(save.cards).size} / 84`;
  $("startCollecting").style.display=save.started?"none":"inline-block";
  $("openPackBtn").disabled=save.packs<=0;
  renderPile();
  renderBook();
}
function renderPile(){
  $("packPile").innerHTML="";
  for(let i=0;i<Math.min(save.packs,3);i++){
    const p=document.createElement("div");p.className="mini-pack";p.style.left=(i*15)+"px";p.style.top=(i*5)+"px";p.textContent="📦";p.style.display="grid";p.style.placeItems="center";p.style.fontSize="2rem";$("packPile").appendChild(p);
  }
  $("sortingPile").textContent=save.sorting?`${save.sorting} cards waiting to sort.`:"No cards waiting.";
}
function renderBook(){
  const grid=$("bookCards"), empty=$("emptyBook"), sil=$("silhouetteGrid");
  grid.innerHTML="";
  if(save.cards.length===0){empty.style.display="grid";sil.style.display="grid";return}
  empty.style.display="none";sil.style.display="none";
  [...new Set(save.cards)].slice(0,8).forEach(name=>{
    const c=document.createElement("div");c.className="book-card";c.innerHTML=`<div><strong>${name}</strong><br><small>Basic 1/5</small></div>`;grid.appendChild(c);
  });
}
function modal(html,canClose=true){
  $("modalContent").innerHTML=html;
  $("modal").classList.remove("hidden");
  $("closeModal").style.display=canClose?"block":"none";
}
$("closeModal").onclick=()=>$("modal").classList.add("hidden");

$("startCollecting").onclick=()=>{
  save.started=true;save.packs=2;save.token=false;persist();render();
  modal(`<p class="eyebrow">WELCOME, COLLECTOR</p><h2>Your first packs are waiting.</h2><p>Open the first Starter Pack to begin your Dinosaur Book.</p><div class="starter-packs"><div id="starterOne" class="starter-pack">📦</div><div class="starter-pack">📦</div></div><p class="hint">Both Starter Packs contain Basic cards.</p>`,false);
  setTimeout(()=>{$("starterOne").onclick=()=>openStarterPack(1)},0);
};

function openStarterPack(num){
  const pulls=Array.from({length:4},()=>dinos[Math.floor(Math.random()*dinos.length)]);
  let i=0;
  function next(){
    if(i<4){
      const name=pulls[i++];
      modal(`<p class="eyebrow">STARTER PACK ${num}</p><div class="reveal-card"><div><div style="font-size:4rem">🦖</div><h3>${name}</h3><p>BASIC</p></div></div><button id="flick" class="modal-button">FLICK CARD →</button>`,false);
      $("flick").onclick=()=>{save.cards.push(name);save.sorting++;save.income+=4;persist();next()};
    }else if(num===1){
      modal(`<p class="eyebrow">SOMETHING ELSE WAS IN THE PACK...</p><div class="reveal-card"><div><div class="token-big">CM</div><h3>THE COLLECTOR</h3><p>STARTER TOKEN</p></div></div><button id="equipToken" class="modal-button">EQUIP TOKEN</button>`,false);
      $("equipToken").onclick=()=>{save.token=true;save.openedStarter=1;persist();render();modal(`<h2>Token Equipped!</h2><p>The Collector now travels your Collection Path with you.</p><button id="openSecond" class="modal-button">OPEN STARTER PACK #2</button>`,false);$("openSecond").onclick=()=>openStarterPack(2)};
    }else{
      save.packs=0;save.openedStarter=2;save.path=1;persist();render();
      modal(`<h2>You're collecting!</h2><p>Your cards are now waiting on the Sorting Table. New cards will reveal Dinosaur sections in your Book.</p><button id="goTable" class="modal-button">GO TO COLLECTION TABLE</button>`,true);
      $("goTable").onclick=()=>{document.querySelector('[data-view="table"]').click();$("modal").classList.add("hidden")};
    }
  }
  next();
}

$("sortAll").onclick=()=>{
  if(!save.sorting)return alert("Nothing to sort.");
  save.sorting=0;persist();render();alert("Routine cards sorted. In the full build, NEW cards and 5/5 MAX cards will still require manual placement.");
};
$("openPackBtn").onclick=()=>alert("Starter pack reveal is wired. Purchased-pack opening comes next.");

function spawnPack(){
  if(!save.started)return;
  const info=packTypes[Math.floor(Math.random()*packTypes.length)];
  const p=document.createElement("button");
  p.className=`moving-pack ${info.className}`;
  p.innerHTML=`<span>${info.symbol}</span>`;
  p.title=info.name;
  $("belt").appendChild(p);
  p.onclick=()=>{
    p.style.animationPlayState="paused";
    modal(`<p class="eyebrow">PACK ON BELT</p><div class="starter-pack ${info.className}" style="margin:25px auto">${info.symbol}</div><h2>${info.name}</h2><h3>$${info.price.toLocaleString()}</h3><button id="buyBelt" class="modal-button">BUY PACK</button><button id="returnBelt" class="modal-button" style="margin-top:8px;background:#444;color:white">RETURN TO BELT</button>`);
    $("buyBelt").onclick=()=>{if(save.packs>=10)return alert("Your pack pile is full.");if(save.money<info.price)return alert("Not enough money yet.");save.money-=info.price;save.packs++;p.remove();persist();render();$("modal").classList.add("hidden")};
    $("returnBelt").onclick=()=>{$("modal").classList.add("hidden");p.style.animationPlayState="running"};
  };
  setTimeout(()=>p.remove(),30500);
}
setInterval(spawnPack,10000);
setTimeout(spawnPack,1200);

setInterval(()=>{if(save.started&&save.income){save.money+=save.income;persist();render()}},1000);

$("restart").onclick=()=>{
  if(confirm("RESTART Collection Master? This clears your money, cards, packs, Token progress and local test save.")){
    localStorage.removeItem(SAVE_KEY);save=fresh();render();location.reload();
  }
};
render();
