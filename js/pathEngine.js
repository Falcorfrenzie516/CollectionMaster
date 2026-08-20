export class PathEngine {
  constructor({theme, board, regionsEl, nodesEl, svgEl, tokenEl, onNodeClick}) {
    this.theme = theme;
    this.board = board;
    this.regionsEl = regionsEl;
    this.nodesEl = nodesEl;
    this.svgEl = svgEl;
    this.tokenEl = tokenEl;
    this.onNodeClick = onNodeClick;
    this.regionHeight = 900;
    this.nodePositions = new Map();
  }

  build() {
    this.regionsEl.innerHTML = "";
    this.nodesEl.innerHTML = "";
    this.svgEl.innerHTML = "";
    this.board.style.setProperty("--region-height", `${this.regionHeight}px`);
    this.board.style.height = `${this.regionHeight * this.theme.regions.length}px`;

    this.theme.regions.forEach((region, index) => {
      this.regionsEl.appendChild(this.createRegion(region, index));
    });

    const points = [];
    for (let node=1; node<=this.theme.nodeCount; node++) {
      const pos = this.nodePosition(node);
      this.nodePositions.set(node, pos);
      points.push(pos);
      this.nodesEl.appendChild(this.createNode(node, pos));
    }

    this.drawRoute(points);
  }

  createRegion(region, index) {
    const el = document.createElement("section");
    el.className = `path-region env-${region.environment} density-${region.density} water-${region.water} light-${region.lighting}`;
    el.dataset.region = index;
    el.style.top = `${index*this.regionHeight}px`;
    el.style.setProperty("--p1", region.palette[0]);
    el.style.setProperty("--p2", region.palette[1]);
    el.style.setProperty("--p3", region.palette[2]);
    el.style.setProperty("--p4", region.palette[3]);

    el.innerHTML = `
      <div class="environment-sky"></div>
      <div class="environment-back"></div>
      <div class="environment-mid"></div>
      <div class="environment-water"></div>
      <div class="environment-ground"></div>
      <div class="environment-front"></div>
      <div class="environment-fog"></div>
      <div class="region-label">
        <span>REGION ${index+1}</span>
        <strong>${region.name}</strong>
        <small>NODES ${index*this.theme.nodesPerRegion+1}–${(index+1)*this.theme.nodesPerRegion}</small>
      </div>
      <div class="landmark">${region.landmark}</div>
    `;

    this.decorateRegion(el, region, index);
    return el;
  }

  seeded(index, salt=0) {
    const x = Math.sin((index+1)*9283.33 + salt*1337.17) * 43758.5453;
    return x - Math.floor(x);
  }

  decorateRegion(el, region, regionIndex) {
    const counts = {
      heavy: 28,
      medium: 18,
      low: 10,
      sparse: 7
    };

    const treeCount = counts[region.density] ?? 14;
    const frag = document.createDocumentFragment();

    const add = (cls, i, area="front") => {
      const d = document.createElement("i");
      d.className = `env-object ${cls}`;
      const rx = this.seeded(regionIndex*100+i, 1);
      const ry = this.seeded(regionIndex*100+i, 2);
      const rs = this.seeded(regionIndex*100+i, 3);
      d.style.left = `${3 + rx*94}%`;
      d.style.top = `${8 + ry*84}%`;
      d.style.transform = `scale(${0.6 + rs*1.1}) rotate(${(rx-.5)*14}deg)`;
      d.style.opacity = `${0.48 + this.seeded(regionIndex*100+i,4)*0.48}`;
      d.dataset.area = area;
      frag.appendChild(d);
    };

    const props = new Set(region.props);

    if (props.has("trees")) for(let i=0;i<treeCount;i++) add("tree",i);
    if (props.has("ferns")) for(let i=0;i<Math.round(treeCount*.75);i++) add("fern",40+i);
    if (props.has("grasses")) for(let i=0;i<18;i++) add("grass",60+i);
    if (props.has("rocks") || props.has("boulders")) for(let i=0;i<14;i++) add("rock",80+i);
    if (props.has("cliffs")) for(let i=0;i<8;i++) add("cliff",100+i,"back");
    if (props.has("reeds")) for(let i=0;i<22;i++) add("reed",120+i);
    if (props.has("fallenLogs")) for(let i=0;i<7;i++) add("log",150+i);
    if (props.has("bones")) for(let i=0;i<8;i++) add("bone",170+i);
    if (props.has("deadTrees")) for(let i=0;i<8;i++) add("dead-tree",190+i);
    if (props.has("ash")) for(let i=0;i<18;i++) add("ash",210+i);

    el.querySelector(".environment-front").appendChild(frag);

    if (props.has("bridge")) {
      const bridge = document.createElement("i");
      bridge.className = "env-object bridge";
      bridge.style.left = "47%";
      bridge.style.top = "55%";
      el.querySelector(".environment-front").appendChild(bridge);
    }
  }

  nodePosition(node) {
    const index = node-1;
    const region = Math.floor(index/this.theme.nodesPerRegion);
    const within = index%this.theme.nodesPerRegion;
    const pattern = [
      [22,12],[50,18],[78,12],
      [80,42],[52,49],[23,43],
      [25,73],[51,80],[78,73]
    ];
    const [x, localY] = pattern[within];
    return {x, y:region*this.regionHeight + localY/100*this.regionHeight, region};
  }

  createNode(node, pos) {
    const b = document.createElement("button");
    b.className = "long-node";
    b.id = `pathNode${node}`;
    b.dataset.node = node;
    b.textContent = node;
    b.style.left = `${pos.x}%`;
    b.style.top = `${pos.y}px`;

    const reward = this.theme.rewards[node];
    if (reward) b.classList.add(`reward-${reward}`);

    b.onclick = () => this.onNodeClick?.(node, reward);
    return b;
  }

  drawRoute(points) {
    const px = points.map(p => [p.x/100*this.board.clientWidth, p.y]);
    let d = `M ${px[0][0]} ${px[0][1]}`;
    for(let i=1;i<px.length;i++) {
      const [x0,y0] = px[i-1], [x1,y1] = px[i];
      const dy = (y1-y0)*.55;
      d += ` C ${x0} ${y0+dy}, ${x1} ${y1-dy}, ${x1} ${y1}`;
    }

    ["route-shadow","route-main","route-highlight"].forEach(cls => {
      const p = document.createElementNS("http://www.w3.org/2000/svg","path");
      p.setAttribute("d", d);
      p.setAttribute("class", cls);
      this.svgEl.appendChild(p);
    });
  }

  updateProgress(currentNode, tokenVisible=true) {
    const current = Math.max(1, Math.min(this.theme.nodeCount, currentNode));
    this.nodesEl.querySelectorAll(".long-node").forEach(el => {
      const n = Number(el.dataset.node);
      el.classList.toggle("completed", n < current);
      el.classList.toggle("current", n === current);
    });

    const pos = this.nodePositions.get(current);
    if (pos && this.tokenEl) {
      this.tokenEl.style.left = `calc(${pos.x}% + 56px)`;
      this.tokenEl.style.top = `${pos.y}px`;
      this.tokenEl.style.opacity = tokenVisible ? 1 : .35;
    }
  }
}
