// @ts-ignore
class N {
  phase: number;
  offset: number;
  frequency: number;
  amplitude: number;
  constructor(e: { phase?: number; offset?: number; frequency?: number; amplitude?: number }) {
    this.phase = e.phase || 0;
    this.offset = e.offset || 0;
    this.frequency = e.frequency || 0.001;
    this.amplitude = e.amplitude || 1;
  }
  update() {
    return (
      (this.phase += this.frequency),
      (e = this.offset + Math.sin(this.phase) * this.amplitude)
    );
  }
  value() {
    return e;
  }
}

// @ts-ignore
class Line {
  spring: number;
  friction: number;
  nodes: Node[];
  constructor(e: { spring: number }) {
    this.spring = e.spring + 0.1 * Math.random() - 0.05;
    this.friction = E.friction + 0.01 * Math.random() - 0.005;
    this.nodes = [];
    for (let t = 0; t < E.size; t++) {
      const node = new Node();
      node.x = pos.x;
      node.y = pos.y;
      this.nodes.push(node);
    }
  }
  update() {
    let e = this.spring,
      t = this.nodes[0];
    t.vx += (pos.x - t.x) * e;
    t.vy += (pos.y - t.y) * e;
    for (let n, i = 0, a = this.nodes.length; i < a; i++)
      (t = this.nodes[i]),
        0 < i &&
          ((n = this.nodes[i - 1]),
          (t.vx += (n.x - t.x) * e),
          (t.vy += (n.y - t.y) * e),
          (t.vx += n.vx * E.dampening),
          (t.vy += n.vy * E.dampening)),
        (t.vx *= this.friction),
        (t.vy *= this.friction),
        (t.x += t.vx),
        (t.y += t.vy),
        (e *= E.tension);
  }
  draw() {
    let e,
      t,
      n = this.nodes[0].x,
      i = this.nodes[0].y;
    ctx.beginPath();
    ctx.moveTo(n, i);
    let a;
    for (a = 1; a < this.nodes.length - 2; a++) {
      e = this.nodes[a];
      t = this.nodes[a + 1];
      n = 0.5 * (e.x + t.x);
      i = 0.5 * (e.y + t.y);
      ctx.quadraticCurveTo(e.x, e.y, n, i);
    }
    e = this.nodes[a];
    t = this.nodes[a + 1];
    ctx.quadraticCurveTo(e.x, e.y, t.x, t.y);
    ctx.stroke();
    ctx.closePath();
  }
}

// @ts-ignore
interface Pos {
  x: number;
  y: number;
}

function onMousemove(e: MouseEvent | TouchEvent) {
  function o() {
    lines = [];
    for (let e = 0; e < E.trails; e++)
      lines.push(new Line({ spring: 0.45 + (e / E.trails) * 0.025 }));
  }
  function c(e: MouseEvent | TouchEvent) {
    if ('touches' in e && e.touches) {
      pos.x = e.touches[0].pageX;
      pos.y = e.touches[0].pageY;
    } else if ('clientX' in e) {
      pos.x = e.clientX;
      pos.y = e.clientY;
    }
    e.preventDefault();
  }
  function l(e: TouchEvent) {
    1 == e.touches.length &&
      ((pos.x = e.touches[0].pageX), (pos.y = e.touches[0].pageY));
  }
  document.removeEventListener("mousemove", onMousemove);
  document.removeEventListener("touchstart", onMousemove);
  document.addEventListener("mousemove", c);
  document.addEventListener("touchmove", c);
  document.addEventListener("touchstart", l);
  c(e);
  o();
  render();
}

function render() {
  // @ts-ignore
  if (ctx.running) {
    // @ts-ignore
    ctx.globalCompositeOperation = "source-over";
    // @ts-ignore
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // @ts-ignore
    ctx.globalCompositeOperation = "lighter";
    // @ts-ignore
    ctx.strokeStyle = "hsla(" + Math.round(f.update()) + ",100%,50%,0.025)";
    // @ts-ignore
    ctx.lineWidth = 10;
    for (var e, t = 0; t < E.trails; t++) {
      // @ts-ignore
      (e = lines[t]).update();
      e.draw();
    }
    // @ts-ignore
    ctx.frame++;
    window.requestAnimationFrame(render);
  }
}

function resizeCanvas() {
  // @ts-ignore
  ctx.canvas.width = window.innerWidth;
  // @ts-ignore
  ctx.canvas.height = window.innerHeight;
}

// @ts-ignore
let ctx: CanvasRenderingContext2D & { running?: boolean; frame?: number };
let f: N;
let e: number = 0;
let pos: Pos = { x: 0, y: 0 };
let lines: Line[] = [];
const E = {
  debug: true,
  friction: 0.5,
  trails: 80,
  size: 50,
  dampening: 0.025,
  tension: 0.99,
};

class Node {
  x: number;
  y: number;
  vy: number;
  vx: number;
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vy = 0;
    this.vx = 0;
  }
}

export const stopCanvas = function () {
  if (ctx) {
    ctx.running = false;
    document.removeEventListener("mousemove", onMousemove);
    document.removeEventListener("touchstart", onMousemove);
    document.body.removeEventListener("orientationchange", resizeCanvas);
    window.removeEventListener("resize", resizeCanvas);
    window.removeEventListener("focus", () => {
      if (!ctx.running) {
        ctx.running = true;
        render();
      }
    });
    window.removeEventListener("blur", () => {
      ctx.running = true;
    });
  }
};

export const renderCanvas = function () {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  if (!canvas) {
    console.warn("Canvas element not found. Skipping renderCanvas initialization.");
    return;
  }
  ctx = canvas.getContext("2d") as CanvasRenderingContext2D & { running?: boolean; frame?: number };
  if (!ctx) {
    console.error("Failed to get 2D context for canvas.");
    return;
  }
  ctx.running = true;
  ctx.frame = 1;
  f = new N({
    phase: Math.random() * 2 * Math.PI,
    amplitude: 85,
    frequency: 0.0015,
    offset: 285,
  });
  document.addEventListener("mousemove", onMousemove);
  document.addEventListener("touchstart", onMousemove);
  document.body.addEventListener("orientationchange", resizeCanvas);
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("focus", () => {
    if (!ctx.running) {
      ctx.running = true;
      render();
    }
  });
  window.addEventListener("blur", () => {
    ctx.running = true;
  });
  resizeCanvas();
};
