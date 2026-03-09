# Asteroids (Angular 21 Canvas Demo)

A modern, lightweight recreation of the 1979 *Asteroids* arcade game, rebuilt as an Angular 21 component and rendered entirely on an HTML5 `<canvas>`.  
This demo lives inside the official Matthew Lind portfolio and showcases real‑time rendering, custom physics, collision detection, and classic vector‑style visuals.

🔗 **Live Demo:**  
https://matthewlind.com/asteroids

---

## Overview

This component is a self‑contained game loop implemented in TypeScript, designed to demonstrate:

- Real‑time canvas rendering inside an Angular 21 application  
- A custom physics engine (velocity, thrust, rotation, friction, screen wrapping)  
- Procedurally generated asteroids with polygonal “boulder‑style” silhouettes  
- Bullet firing, asteroid splitting, and particle‑based explosions  
- Input handling via Angular’s `@HostListener`  
- Clean separation between rendering, update logic, and component lifecycle  

The result is a faithful, responsive, browser‑friendly homage to the original arcade classic.

---

## Features

### 🚀 Player Ship
- Rotates left/right  
- Thrusts forward with acceleration  
- Continuous firing system  
- Authentic 1979‑style flickering thrust flame  
- Screen wrapping on all edges  
- Temporary invulnerability after respawn  

### 🪨 Asteroids
- Procedurally generated polygonal shapes  
- Chunky, irregular “boulder” silhouettes  
- Slow tumbling rotation  
- Break into smaller asteroids when hit  
- Drift speed scales with asteroid size  
- Fully wrapped movement across screen boundaries  

### 💥 Explosions & Particles
- Ship destruction triggers a burst of debris particles  
- Asteroid hits generate satisfying breakup effects  
- Particles fade naturally over time  

### 🎮 Controls
- **Arrow Left / A** — Rotate left  
- **Arrow Right / D** — Rotate right  
- **Arrow Up / W** — Thrust  
- **Spacebar** — Fire continuously  

---

## Technical Breakdown

### Angular Integration
The game is implemented as a standalone Angular component:

- Uses `AfterViewInit` to initialize the canvas  
- Resizes dynamically with the browser window  
- Runs a custom `requestAnimationFrame` loop  
- Cleans up DOM state on destroy  

### Rendering
All visuals are drawn using the Canvas 2D API:

- Vector‑style outlines  
- No images or sprites  
- Procedural geometry for asteroids  
- Real‑time transformations for ship rotation  

### Physics & Game Loop
The update cycle handles:

- Ship movement, thrust, and friction  
- Bullet lifespan and velocity  
- Asteroid drift and rotation  
- Collision detection (ship ↔ asteroid, bullet ↔ asteroid)  
- Respawn logic and safe‑zone checks  

---

## File Structure
/src/app/pages/asteroids/  
│  
├── asteroids.ts        # Main game logic + rendering  
├── asteroids.html      # Canvas element + UI  
└── asteroids.css       # Minimal styling for full-screen mode  


---

## Purpose

This component exists as a **technical showcase** inside the Matthew Lind portfolio.  
It demonstrates:

- Mastery of TypeScript  
- Canvas rendering inside Angular  
- Real‑time interactive systems  
- Clean architecture and game‑loop design  
- Ability to recreate classic mechanics with modern tooling  

It’s both a nostalgic tribute and a practical demonstration of front‑end engineering skill.

---

## Live Demo

Play the game here:

👉 **https://matthewlind.com/asteroids**

Enjoy blasting some rocks.

