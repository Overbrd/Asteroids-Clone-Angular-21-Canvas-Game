import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';

interface Vec2 {
  x: number;
  y: number;
}

// ----------------------
// ASTEROID CLASS (BOULDER STYLE, CABINET-INSPIRED)
// ----------------------
class Asteroid {
  pos: Vec2;
  vel: Vec2;
  radius: number;
  points: number;
  offsets: number[];
  rotation: number;
  rotationSpeed: number;

  constructor(x: number, y: number, radius: number) {
    this.pos = { x, y };
    this.radius = radius;

    // Slower drift for heavier "boulder" feel
    const baseSpeed = 32;
    const speedScale = Math.max(0.55, 1.1 - this.radius * 0.01);

    this.vel = {
      x: (Math.random() - 0.5) * baseSpeed * speedScale,
      y: (Math.random() - 0.5) * baseSpeed * speedScale,
    };

    // ORIGINAL-STYLE: 8–12 POINTS, CHUNKY BUT NOT SMOOTH
    this.points = 8 + Math.floor(Math.random() * 5); // 8–12 vertices

    // RADIAL DISTORTIONS AROUND THE BASE RADIUS (0.6–1.4x)
    this.offsets = [];
    for (let i = 0; i < this.points; i++) {
      // Base jaggedness around 1.0 (±0.3)
      let jaggedness = 0.8 + Math.random() * 0.6; // 0.8–1.4

      // Occasionally push a facet in or out a bit more
      if (Math.random() < 0.25) {
        jaggedness += (Math.random() - 0.5) * 0.4; // ±0.2 extra
      }

      this.offsets.push(jaggedness);
    }

    // SLOW TUMBLING ROTATION
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.35;
  }

  update(dt: number, canvas: HTMLCanvasElement) {
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;

    this.rotation += this.rotationSpeed * dt;

    if (this.pos.x < 0) this.pos.x = canvas.width;
    if (this.pos.x > canvas.width) this.pos.x = 0;
    if (this.pos.y < 0) this.pos.y = canvas.height;
    if (this.pos.y > canvas.height) this.pos.y = 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const angleStep = (Math.PI * 2) / this.points;

    ctx.strokeStyle = '#fff';
    ctx.beginPath();

    for (let i = 0; i <= this.points; i++) {
      const angle = this.rotation + i * angleStep;

      // Offset is now a modest scalar around the base radius
      const offset = this.radius * this.offsets[i % this.points];

      const x = this.pos.x + Math.cos(angle) * offset;
      const y = this.pos.y + Math.sin(angle) * offset;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();
  }
}



// ----------------------
// BULLET CLASS
// ----------------------
class Bullet {
  pos: Vec2;
  vel: Vec2;
  life = 1.2;

  constructor(x: number, y: number, angle: number) {
    this.pos = { x, y };
    this.vel = {
      x: Math.cos(angle) * 600, // SUPER FAST BULLETS
      y: Math.sin(angle) * 600,
    };
  }

  update(dt: number) {
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.life -= dt;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(this.pos.x - 2, this.pos.y - 2, 4, 4);
  }
}

// ----------------------
// PARTICLE CLASS
// ----------------------
class Particle {
  pos: Vec2;
  vel: Vec2;
  life: number;

  constructor(x: number, y: number) {
    this.pos = { x, y };
    this.vel = {
      x: (Math.random() - 0.5) * 300,
      y: (Math.random() - 0.5) * 300,
    };
    this.life = 0.6;
  }

  update(dt: number) {
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.life -= dt;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(this.pos.x, this.pos.y, 2, 2);
  }
}

@Component({
  selector: 'app-asteroids',
  templateUrl: './asteroids.html',
  styleUrls: ['./asteroids.css'],
})
export class Asteroids implements AfterViewInit {
  @ViewChild('gameCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;

  private ship = {
    pos: { x: 0, y: 0 } as Vec2,
    vel: { x: 0, y: 0 } as Vec2,
    angle: 0,
    thrusting: false,
    rotating: 0,
  };

  private keys: Record<string, boolean> = {};
  private lastTime = 0;

  private asteroids: Asteroid[] = [];
  private bullets: Bullet[] = [];
  private particles: Particle[] = [];

  shipDead = false;
  private respawnTimer = 0;
  private invulnTimer = 0;

  private firing = false;
  private lastBulletTime = 0;

  ngOnInit() {
    document.body.classList.add('asteroids-mode');
  }

  ngOnDestroy() {
    document.body.classList.remove('asteroids-mode');
  }

  // ----------------------
  // INIT
  // ----------------------
  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      if (this.shipDead) {
        this.ship.pos.x = canvas.width / 2;
        this.ship.pos.y = canvas.height / 2;
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;

    this.ship.pos = {
      x: canvas.width / 2,
      y: canvas.height / 2,
    };

    this.spawnAsteroids();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  private spawnAsteroids() {
    const canvas = this.canvasRef.nativeElement;
    this.asteroids = [];

    for (let i = 0; i < 4; i++) {
      let x, y;
      do {
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;
      } while (Math.hypot(x - this.ship.pos.x, y - this.ship.pos.y) < 200);

      this.asteroids.push(new Asteroid(x, y, 50 + Math.random() * 20));
    }
  }

  // ----------------------
  // INPUT
  // ----------------------
  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (e.key === ' ') {
      e.preventDefault();
      this.firing = true;
    }

    this.keys[e.key.toLowerCase()] = true;
    this.updateControls();
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(e: KeyboardEvent) {
    if (e.key === ' ') {
      this.firing = false;
    }

    this.keys[e.key.toLowerCase()] = false;
    this.updateControls();
  }

  private updateControls() {
    if (this.shipDead) return;

    this.ship.rotating = 0;
    if (this.keys['arrowleft'] || this.keys['a']) this.ship.rotating = -1;
    if (this.keys['arrowright'] || this.keys['d']) this.ship.rotating = 1;
    this.ship.thrusting = !!(this.keys['arrowup'] || this.keys['w']);
  }

  // ----------------------
  // GAME LOOP
  // ----------------------
  private gameLoop(timestamp: number) {
    const dt = (timestamp - this.lastTime) / 1000 || 0;
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  // ----------------------
  // UPDATE
  // ----------------------
  private update(dt: number) {
    const canvas = this.canvasRef.nativeElement;

    this.particles = this.particles.filter((p) => {
      p.update(dt);
      return p.life > 0;
    });

    if (this.shipDead) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) this.resetShip();
      return;
    }

    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt;
      if (this.invulnTimer < 0) this.invulnTimer = 0;
    }

    const ROT_SPEED = 3;
    const THRUST = 200;
    const FRICTION = 0.995;

    this.ship.angle += this.ship.rotating * ROT_SPEED * dt;

    if (this.ship.thrusting) {
      this.ship.vel.x += Math.cos(this.ship.angle) * THRUST * dt;
      this.ship.vel.y += Math.sin(this.ship.angle) * THRUST * dt;
    }

    this.ship.vel.x *= FRICTION;
    this.ship.vel.y *= FRICTION;

    this.ship.pos.x += this.ship.vel.x * dt;
    this.ship.pos.y += this.ship.vel.y * dt;

    if (this.ship.pos.x < 0) this.ship.pos.x = canvas.width;
    if (this.ship.pos.x > canvas.width) this.ship.pos.x = 0;
    if (this.ship.pos.y < 0) this.ship.pos.y = canvas.height;
    if (this.ship.pos.y > canvas.height) this.ship.pos.y = 0;

    // ----------------------
    // CONTINUOUS FIRING
    // ----------------------
    if (this.firing && !this.shipDead) {
      const now = performance.now();
      if (now - this.lastBulletTime > 40) {
        this.lastBulletTime = now;
        this.bullets.push(
          new Bullet(this.ship.pos.x, this.ship.pos.y, this.ship.angle)
        );
      }
    }

    this.bullets = this.bullets.filter((b) => {
      b.update(dt);
      return b.life > 0;
    });

    this.asteroids.forEach((a) => a.update(dt, canvas));

    // ----------------------
    // BULLET COLLISIONS
    // ----------------------
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const a = this.asteroids[i];

      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const b = this.bullets[j];

        const dx = a.pos.x - b.pos.x;
        const dy = a.pos.y - b.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < a.radius) {
          if (a.radius > 20) {
            this.asteroids.push(new Asteroid(a.pos.x, a.pos.y, a.radius / 2));
            this.asteroids.push(new Asteroid(a.pos.x, a.pos.y, a.radius / 2));
          }

          this.asteroids.splice(i, 1);
          this.bullets.splice(j, 1);
          break;
        }
      }
    }

// ----------------------
// CHECK IF ALL ASTEROIDS ARE GONE → START NEW WAVE
// ----------------------
if (this.asteroids.length === 0) {
  this.spawnAsteroids();
}

 
    // ----------------------
    // SHIP COLLISION
    // ----------------------
    if (this.invulnTimer <= 0) {
      const cos = Math.cos(this.ship.angle);
      const sin = Math.sin(this.ship.angle);

      const v1 = {
        x: this.ship.pos.x + cos * 15,
        y: this.ship.pos.y + sin * 15,
      };
      const v2 = {
        x: this.ship.pos.x + cos * -10 - sin * 10,
        y: this.ship.pos.y + sin * -10 + cos * 10,
      };
      const v3 = {
        x: this.ship.pos.x + cos * -10 - sin * -10,
        y: this.ship.pos.y + sin * -10 + cos * -10,
      };

      const shipEdges: [Vec2, Vec2][] = [
        [v1, v2],
        [v2, v3],
        [v3, v1],
      ];

      const pointToSegmentDist = (
        px: number,
        py: number,
        a: Vec2,
        b: Vec2
      ) => {
        const abx = b.x - a.x;
        const aby = b.y - a.y;
        const apx = px - a.x;
        const apy = py - a.y;

        const abLenSq = abx * abx + aby * aby;
        let t = (apx * abx + apy * aby) / abLenSq;
        t = Math.max(0, Math.min(1, t));

        const cx = a.x + abx * t;
        const cy = a.y + aby * t;

        return Math.hypot(px - cx, py - cy);
      };

      for (const a of this.asteroids) {
        if (
          Math.hypot(a.pos.x - v1.x, a.pos.y - v1.y) < a.radius ||
          Math.hypot(a.pos.x - v2.x, a.pos.y - v2.y) < a.radius ||
          Math.hypot(a.pos.x - v3.x, a.pos.y - v3.y) < a.radius
        ) {
          this.explodeShip();
          break;
        }

        for (const [p1, p2] of shipEdges) {
          if (pointToSegmentDist(a.pos.x, a.pos.y, p1, p2) < a.radius) {
            this.explodeShip();
            break;
          }
        }
      }
    }
  }

  // ----------------------
  // EXPLOSION + RESPAWN
  // ----------------------
  private explodeShip() {
    this.shipDead = true;
    this.respawnTimer = 1.2;
    this.invulnTimer = 0;

    for (let i = 0; i < 40; i++) {
      this.particles.push(new Particle(this.ship.pos.x, this.ship.pos.y));
    }
  }

  restartGame() {
    const canvas = this.canvasRef.nativeElement;

    this.shipDead = false;
    this.bullets = [];
    this.particles = [];

    this.ship.pos = {
      x: canvas.width / 2,
      y: canvas.height / 2,
    };
    this.ship.vel = { x: 0, y: 0 };
    this.ship.angle = 0;

    this.invulnTimer = 2;
    this.respawnTimer = 0;

    this.spawnAsteroids();
  }

  private resetShip() {
    const canvas = this.canvasRef.nativeElement;

    for (let i = 0; i < 40; i++) {
      const safeX = Math.random() * canvas.width;
      const safeY = Math.random() * canvas.height;

      let safe = true;

      for (const a of this.asteroids) {
        if (Math.hypot(a.pos.x - safeX, a.pos.y - safeY) < a.radius + 80) {
          safe = false;
          break;
        }
      }

      if (safe) {
        this.ship.pos = { x: safeX, y: safeY };
        this.ship.vel = { x: 0, y: 0 };
        this.ship.angle = 0;
        this.shipDead = false;
        this.invulnTimer = 2;
        return;
      }
    }

    this.ship.pos = {
      x: canvas.width / 2,
      y: canvas.height / 2,
    };
    this.ship.vel = { x: 0, y: 0 };
    this.ship.angle = 0;
    this.shipDead = false;
    this.invulnTimer = 2;
  }

  // ----------------------
  // DRAW
  // ----------------------
  private draw() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.particles.forEach((p) => p.draw(this.ctx));

// ----------------------
// SHIP
// ----------------------
if (!this.shipDead) {
  this.ctx.save();
  this.ctx.translate(this.ship.pos.x, this.ship.pos.y);
  this.ctx.rotate(this.ship.angle);

  // SHIP OUTLINE
  this.ctx.strokeStyle = '#ffffff';
  this.ctx.lineWidth = 2;
  this.ctx.beginPath();
  this.ctx.moveTo(15, 0);       // nose
  this.ctx.lineTo(-10, 10);     // left rear
  this.ctx.lineTo(-5, 0);       // inner left
  this.ctx.lineTo(-10, -10);    // right rear
  this.ctx.closePath();
  this.ctx.stroke();

  // AUTHENTIC 1979 THRUST FLAME (flicker)
  if (this.ship.thrusting && Math.random() < 0.6) {
    this.ctx.beginPath();
    this.ctx.moveTo(-10, 0);    // base of ship tail
    this.ctx.lineTo(-22, 6);    // lower flame tip
    this.ctx.lineTo(-22, -6);   // upper flame tip
    this.ctx.closePath();
    this.ctx.stroke();
  }

  this.ctx.restore();
}


    this.asteroids.forEach((a) => a.draw(this.ctx));
    this.bullets.forEach((b) => b.draw(this.ctx));
  }
}
