import React from "react";

interface MousePosition {
  x: number;
  y: number;
}

interface CanvasContext extends CanvasRenderingContext2D {
  running: boolean;
  frame: number;
}

export const renderCanvas = () => {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  if (!canvas) return;

  const ctx = canvas.getContext("2d") as CanvasContext;
  if (!ctx) return;

  let lines: Line[] = [];
  const pos: MousePosition = { x: 0, y: 0 };
  const E = {
    debug: true,
    friction: 0.5,
    trails: 80,
    size: 50,
    dampening: 0.025,
    tension: 0.99,
  };

  class Node {
    x: number = 0;
    y: number = 0;
    vx: number = 0;
    vy: number = 0;
  }

  class Oscillator {
    phase: number = 0;
    offset: number = 0;
    frequency: number = 0.001;
    amplitude: number = 1;
    val: number = 0;

    constructor(config: {
      phase?: number;
      offset?: number;
      frequency?: number;
      amplitude?: number;
    }) {
      this.phase = config.phase || 0;
      this.offset = config.offset || 0;
      this.frequency = config.frequency || 0.001;
      this.amplitude = config.amplitude || 1;
    }

    update() {
      this.phase += this.frequency;
      this.val = this.offset + Math.sin(this.phase) * this.amplitude;
      return this.val;
    }
  }

  class Line {
    spring: number;
    friction: number;
    nodes: Node[];

    constructor(config: { spring: number }) {
      this.spring = config.spring + 0.1 * Math.random() - 0.05;
      this.friction = E.friction + 0.01 * Math.random() - 0.005;
      this.nodes = [];
      for (let i = 0; i < E.size; i++) {
        const t = new Node();
        t.x = pos.x;
        t.y = pos.y;
        this.nodes.push(t);
      }
    }

    update() {
      let spring = this.spring;
      let node = this.nodes[0];
      
      node.vx += (pos.x - node.x) * spring;
      node.vy += (pos.y - node.y) * spring;

      for (let i = 0, len = this.nodes.length; i < len; i++) {
        node = this.nodes[i];
        if (i > 0) {
          const prev = this.nodes[i - 1];
          node.vx += (prev.x - node.x) * spring;
          node.vy += (prev.y - node.y) * spring;
          node.vx += prev.vx * E.dampening;
          node.vy += prev.vy * E.dampening;
        }
        node.vx *= this.friction;
        node.vy *= this.friction;
        node.x += node.vx;
        node.y += node.vy;
        spring *= E.tension;
      }
    }

    draw(ctx: CanvasRenderingContext2D) {
      let curr, next;
      let x = this.nodes[0].x;
      let y = this.nodes[0].y;

      ctx.beginPath();
      ctx.moveTo(x, y);

      for (let i = 1, len = this.nodes.length - 2; i < len; i++) {
        curr = this.nodes[i];
        next = this.nodes[i + 1];
        x = 0.5 * (curr.x + next.x);
        y = 0.5 * (curr.y + next.y);
        ctx.quadraticCurveTo(curr.x, curr.y, x, y);
      }

      curr = this.nodes[this.nodes.length - 2];
      next = this.nodes[this.nodes.length - 1];
      ctx.quadraticCurveTo(curr.x, curr.y, next.x, next.y);
      ctx.stroke();
      ctx.closePath();
    }
  }

  const oscillator = new Oscillator({
    phase: Math.random() * 2 * Math.PI,
    amplitude: 85,
    frequency: 0.0015,
    offset: 285,
  });

  const resizeCanvas = () => {
    ctx.canvas.width = window.innerWidth - 20;
    ctx.canvas.height = window.innerHeight;
  };

  const render = () => {
    if (ctx.running) {
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `hsla(${Math.round(oscillator.update())},100%,50%,0.025)`;
      ctx.lineWidth = 10;
      
      for (let i = 0; i < E.trails; i++) {
        if (lines[i]) {
          lines[i].update();
          lines[i].draw(ctx);
        }
      }
      ctx.frame++;
      window.requestAnimationFrame(render);
    }
  };

  const initLines = () => {
    lines = [];
    for (let i = 0; i < E.trails; i++) {
      lines.push(new Line({ spring: 0.45 + (i / E.trails) * 0.025 }));
    }
  };

  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if ('touches' in e) {
      pos.x = e.touches[0].pageX;
      pos.y = e.touches[0].pageY;
    } else {
      pos.x = (e as MouseEvent).clientX;
      pos.y = (e as MouseEvent).clientY;
    }
    e.preventDefault();
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      pos.x = e.touches[0].pageX;
      pos.y = e.touches[0].pageY;
    }
  };

  const onMouseMove = (e: MouseEvent | TouchEvent) => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("touchstart", onMouseMove);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("touchmove", handleMouseMove);
      document.addEventListener("touchstart", handleTouchStart);
      
      handleMouseMove(e);
      initLines();
      render();
  }

  ctx.running = true;
  ctx.frame = 1;
  
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("touchstart", onMouseMove);
  document.body.addEventListener("orientationchange", resizeCanvas);
  window.addEventListener("resize", resizeCanvas);
  
  resizeCanvas();

  return () => {
    ctx.running = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("touchstart", onMouseMove);
    document.removeEventListener("touchmove", handleMouseMove);
    document.removeEventListener("touchstart", handleTouchStart);
    document.body.removeEventListener("orientationchange", resizeCanvas);
    window.removeEventListener("resize", resizeCanvas);
  };
};

export const Canvas = () => {
  React.useEffect(() => {
    renderCanvas();
  }, []);

  return <canvas id="canvas" />;
};
