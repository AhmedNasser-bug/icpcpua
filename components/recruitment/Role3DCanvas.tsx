"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type Role3DType = "instructor" | "ops-pr" | "hr" | "design-dev" | "marketing";

interface Role3DCanvasProps {
  role: Role3DType | string;
  wireframeOnly?: boolean;
  autoRotate?: boolean;
  className?: string;
  interactive?: boolean;
  height?: string;
}

export function Role3DCanvas({
  role,
  wireframeOnly = false,
  autoRotate = true,
  className = "",
  interactive = true,
  height = "260px",
}: Role3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;
    let isVisible = true;

    // Normalizing role identifier
    const normalizedRole: Role3DType =
      role === "technical" ? "instructor" : (role as Role3DType);

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = null;

    const width = container.clientWidth || 300;
    const heightPx = container.clientHeight || 260;

    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Master container for rotation & mouse control
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight2.position.set(-5, -5, -4);
    scene.add(dirLight2);

    // Track disposables for rigorous cleanup
    const disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];

    // Color definitions based on Neo-Brutalist ICPC Design Tokens
    const COLOR_YELLOW = 0xffd500;
    const COLOR_CYAN = 0x00e5ff;
    const COLOR_PURPLE = 0x7b2cbf;
    const COLOR_PURPLE_LIGHT = 0xb5179e;
    const COLOR_PINK = 0xff0055;
    const COLOR_ORANGE = 0xff6b00;
    const COLOR_WHITE = 0xffffff;
    const COLOR_DARK = 0x0f0f0f;

    // Tick callbacks for animations
    let onTick: (time: number, delta: number) => void = () => {};

    // -------------------------------------------------------------
    // 1. INSTRUCTOR / TECHNICAL: Algorithmic Binary Tree & Traversing Pulse
    // -------------------------------------------------------------
    if (normalizedRole === "instructor") {
      const treeGroup = new THREE.Group();
      rootGroup.add(treeGroup);

      // Node hierarchy coordinates: root, level 1, level 2
      const nodePositions: THREE.Vector3[] = [
        new THREE.Vector3(0, 2.2, 0),         // 0: Root
        new THREE.Vector3(-1.8, 0.8, 0.4),    // 1: Left Child
        new THREE.Vector3(1.8, 0.8, -0.4),    // 2: Right Child
        new THREE.Vector3(-2.6, -0.8, 0.7),   // 3: Left-Left
        new THREE.Vector3(-1.0, -0.8, 0.1),   // 4: Left-Right
        new THREE.Vector3(1.0, -0.8, -0.1),   // 5: Right-Left
        new THREE.Vector3(2.6, -0.8, -0.7),   // 6: Right-Right
        new THREE.Vector3(-3.0, -2.2, 0.8),   // 7: Leaf
        new THREE.Vector3(-2.2, -2.2, 0.6),   // 8: Leaf
        new THREE.Vector3(2.2, -2.2, -0.6),   // 9: Leaf
        new THREE.Vector3(3.0, -2.2, -0.8),   // 10: Leaf
      ];

      const edges: [number, number][] = [
        [0, 1], [0, 2],
        [1, 3], [1, 4],
        [2, 5], [2, 6],
        [3, 7], [3, 8],
        [6, 9], [6, 10],
      ];

      // Draw Edges as high-contrast lines
      const edgePoints: THREE.Vector3[] = [];
      edges.forEach(([fromIdx, toIdx]) => {
        edgePoints.push(nodePositions[fromIdx]);
        edgePoints.push(nodePositions[toIdx]);
      });

      const edgeGeometry = new THREE.BufferGeometry().setFromPoints(edgePoints);
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: COLOR_WHITE,
        linewidth: 2,
        transparent: true,
        opacity: 0.85,
      });
      disposables.push(edgeGeometry, edgeMaterial);
      const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      treeGroup.add(edgeLines);

      // Create Node Spheres
      const nodeGeo = new THREE.SphereGeometry(0.24, 16, 16);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: COLOR_YELLOW,
        roughness: 0.2,
        metalness: 0.1,
        wireframe: wireframeOnly,
      });
      disposables.push(nodeGeo, nodeMat);

      nodePositions.forEach((pos, idx) => {
        const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
        nodeMesh.position.copy(pos);
        // Slightly enlarge root
        if (idx === 0) nodeMesh.scale.setScalar(1.35);
        treeGroup.add(nodeMesh);
      });

      // Algorithmic Traversing Pulse (Pulsing BFS / DFS Walker)
      const pulseGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: COLOR_CYAN,
      });
      disposables.push(pulseGeo, pulseMat);
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      treeGroup.add(pulseMesh);

      // Algorithmic Bounding Coordinate Ring
      const ringGeo = new THREE.TorusGeometry(3.2, 0.04, 16, 100);
      const ringMat = new THREE.MeshBasicMaterial({
        color: COLOR_YELLOW,
        wireframe: true,
      });
      disposables.push(ringGeo, ringMat);
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2.3;
      treeGroup.add(ringMesh);

      // Path of nodes for the traversal pulse
      const traversalPath = [0, 1, 3, 7, 3, 8, 3, 1, 4, 1, 0, 2, 5, 2, 6, 9, 6, 10, 6, 2, 0];

      onTick = (time) => {
        const speed = 2.2;
        const totalSteps = traversalPath.length - 1;
        const cycleProgress = (time * speed) % totalSteps;
        const currentStep = Math.floor(cycleProgress);
        const nextStep = (currentStep + 1) % traversalPath.length;
        const segmentAlpha = cycleProgress - currentStep;

        const startPos = nodePositions[traversalPath[currentStep]];
        const endPos = nodePositions[traversalPath[nextStep]];
        pulseMesh.position.lerpVectors(startPos, endPos, segmentAlpha);

        // Pulse scale breathing
        const scalePulse = 1 + 0.3 * Math.sin(time * 8);
        pulseMesh.scale.setScalar(scalePulse);

        ringMesh.rotation.z += 0.005;
      };
    }

    // -------------------------------------------------------------
    // 2. OPERATIONS & PR: Radar Dish, Sweeping Beam & Broadcast Ripples
    // -------------------------------------------------------------
    else if (normalizedRole === "ops-pr") {
      const radarGroup = new THREE.Group();
      rootGroup.add(radarGroup);

      // 1. Radar Dish (Curved spherical cap)
      const dishGeo = new THREE.SphereGeometry(2.4, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.45);
      const dishMat = new THREE.MeshStandardMaterial({
        color: COLOR_CYAN,
        roughness: 0.3,
        metalness: 0.2,
        wireframe: true,
        side: THREE.DoubleSide,
      });
      disposables.push(dishGeo, dishMat);
      const dishMesh = new THREE.Mesh(dishGeo, dishMat);
      dishMesh.rotation.x = -Math.PI / 1.5;
      dishMesh.position.y = -0.5;
      radarGroup.add(dishMesh);

      // 2. Dish Feed Horn & Struts
      const hornGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8);
      const hornMat = new THREE.MeshBasicMaterial({ color: COLOR_WHITE });
      disposables.push(hornGeo, hornMat);
      const hornMesh = new THREE.Mesh(hornGeo, hornMat);
      hornMesh.position.set(0, 0.4, 0.6);
      hornMesh.rotation.x = Math.PI / 3.5;
      radarGroup.add(hornMesh);

      // 3. Sweeping Radar Line / Cone
      const sweepGeo = new THREE.ConeGeometry(3.5, 0.1, 32, 1, false, 0, Math.PI * 0.35);
      const sweepMat = new THREE.MeshBasicMaterial({
        color: COLOR_CYAN,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });
      disposables.push(sweepGeo, sweepMat);
      const sweepMesh = new THREE.Mesh(sweepGeo, sweepMat);
      sweepMesh.rotation.x = Math.PI / 2;
      sweepMesh.position.set(0, 0, 0);
      radarGroup.add(sweepMesh);

      // 4. Concentric Broadcast Wave Rings
      const waves: THREE.Mesh[] = [];
      for (let i = 0; i < 3; i++) {
        const waveGeo = new THREE.RingGeometry(0.3, 0.35, 32);
        const waveMat = new THREE.MeshBasicMaterial({
          color: COLOR_CYAN,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
        });
        disposables.push(waveGeo, waveMat);
        const waveMesh = new THREE.Mesh(waveGeo, waveMat);
        waveMesh.rotation.x = -Math.PI / 2;
        waveMesh.position.set(0, 0.8, 1.2);
        waves.push(waveMesh);
        radarGroup.add(waveMesh);
      }

      // 5. Orbiting Satellite Beacons
      const satelliteGroup = new THREE.Group();
      radarGroup.add(satelliteGroup);
      const satGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const satMat = new THREE.MeshStandardMaterial({
        color: COLOR_YELLOW,
        wireframe: false,
      });
      disposables.push(satGeo, satMat);

      for (let i = 0; i < 4; i++) {
        const satMesh = new THREE.Mesh(satGeo, satMat);
        const angle = (i / 4) * Math.PI * 2;
        satMesh.position.set(Math.cos(angle) * 3.4, Math.sin(angle * 2) * 0.8, Math.sin(angle) * 3.4);
        satelliteGroup.add(satMesh);
      }

      onTick = (time) => {
        // Sweep rotation
        sweepMesh.rotation.z = -time * 3.2;

        // Wave rings expansion
        waves.forEach((wave, idx) => {
          const wavePhase = (time * 1.5 + idx * 0.4) % 1;
          const currentScale = 0.5 + wavePhase * 3.2;
          wave.scale.setScalar(currentScale);
          (wave.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - wavePhase);
        });

        // Satellite orbit
        satelliteGroup.rotation.y = time * 0.5;
      };
    }

    // -------------------------------------------------------------
    // 3. HR / MONITORING: Gyroscopic Balance Rings & Safety Shield Core
    // -------------------------------------------------------------
    else if (normalizedRole === "hr") {
      const hrGroup = new THREE.Group();
      rootGroup.add(hrGroup);

      // Center Core: Equilibrium Diamond (Octahedron)
      const coreGeo = new THREE.OctahedronGeometry(1.2, 0);
      const coreMat = new THREE.MeshStandardMaterial({
        color: COLOR_PURPLE,
        roughness: 0.1,
        metalness: 0.3,
        wireframe: wireframeOnly,
      });
      disposables.push(coreGeo, coreMat);
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      hrGroup.add(coreMesh);

      // Outer Wireframe Core
      const wireCoreGeo = new THREE.OctahedronGeometry(1.35, 0);
      const wireCoreMat = new THREE.MeshBasicMaterial({
        color: COLOR_WHITE,
        wireframe: true,
      });
      disposables.push(wireCoreGeo, wireCoreMat);
      const wireCoreMesh = new THREE.Mesh(wireCoreGeo, wireCoreMat);
      hrGroup.add(wireCoreMesh);

      // Gyroscopic Ring 1 (Yaw)
      const ring1Geo = new THREE.TorusGeometry(2.3, 0.08, 16, 64);
      const ring1Mat = new THREE.MeshStandardMaterial({
        color: COLOR_PURPLE_LIGHT,
        metalness: 0.4,
        roughness: 0.2,
      });
      disposables.push(ring1Geo, ring1Mat);
      const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
      hrGroup.add(ring1);

      // Gyroscopic Ring 2 (Pitch)
      const ring2Geo = new THREE.TorusGeometry(2.7, 0.08, 16, 64);
      const ring2Mat = new THREE.MeshStandardMaterial({
        color: COLOR_CYAN,
        metalness: 0.4,
        roughness: 0.2,
      });
      disposables.push(ring2Geo, ring2Mat);
      const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
      hrGroup.add(ring2);

      // Gyroscopic Ring 3 (Roll)
      const ring3Geo = new THREE.TorusGeometry(3.1, 0.08, 16, 64);
      const ring3Mat = new THREE.MeshStandardMaterial({
        color: COLOR_WHITE,
        metalness: 0.2,
        roughness: 0.3,
        wireframe: true,
      });
      disposables.push(ring3Geo, ring3Mat);
      const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
      hrGroup.add(ring3);

      // Orbiting Safety Nodes
      const shieldGroup = new THREE.Group();
      hrGroup.add(shieldGroup);
      const shieldTileGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.06, 6);
      const shieldTileMat = new THREE.MeshStandardMaterial({
        color: COLOR_PURPLE_LIGHT,
      });
      disposables.push(shieldTileGeo, shieldTileMat);

      for (let i = 0; i < 6; i++) {
        const tile = new THREE.Mesh(shieldTileGeo, shieldTileMat);
        const theta = (i / 6) * Math.PI * 2;
        tile.position.set(Math.cos(theta) * 3.6, Math.sin(i * 1.5) * 0.9, Math.sin(theta) * 3.6);
        tile.rotation.x = Math.PI / 2;
        shieldGroup.add(tile);
      }

      onTick = (time) => {
        // Gyroscopic independent rotational axis velocities
        ring1.rotation.x = time * 0.9;
        ring1.rotation.y = time * 0.6;

        ring2.rotation.y = -time * 1.1;
        ring2.rotation.z = time * 0.7;

        ring3.rotation.z = time * 0.8;
        ring3.rotation.x = -time * 0.5;

        // Core gentle breathing
        const floatY = Math.sin(time * 2) * 0.15;
        coreMesh.position.y = floatY;
        wireCoreMesh.position.y = floatY;
        coreMesh.rotation.y = time * 0.4;
        wireCoreMesh.rotation.y = -time * 0.4;

        shieldGroup.rotation.y = -time * 0.3;
      };
    }

    // -------------------------------------------------------------
    // 4. DESIGN / DEV: Brutalist Morphing Tesseract & Vertex Lattice
    // -------------------------------------------------------------
    else if (normalizedRole === "design-dev") {
      const devGroup = new THREE.Group();
      rootGroup.add(devGroup);

      // 4D Tesseract vertices: 16 vertices of a hypercube in 4D: (±1, ±1, ±1, ±1)
      const base4DVertices: number[][] = [];
      for (let x = -1; x <= 1; x += 2) {
        for (let y = -1; y <= 1; y += 2) {
          for (let z = -1; z <= 1; z += 2) {
            for (let w = -1; w <= 1; w += 2) {
              base4DVertices.push([x, y, z, w]);
            }
          }
        }
      }

      // Edges connect vertices that differ in exactly one coordinate
      const edges4D: [number, number][] = [];
      for (let i = 0; i < base4DVertices.length; i++) {
        for (let j = i + 1; j < base4DVertices.length; j++) {
          let diffCount = 0;
          for (let k = 0; k < 4; k++) {
            if (base4DVertices[i][k] !== base4DVertices[j][k]) diffCount++;
          }
          if (diffCount === 1) {
            edges4D.push([i, j]);
          }
        }
      }

      // Buffer geometry for dynamic tesseract edges
      const edgePosArray = new Float32Array(edges4D.length * 2 * 3);
      const tesseractGeo = new THREE.BufferGeometry();
      tesseractGeo.setAttribute("position", new THREE.BufferAttribute(edgePosArray, 3));

      const tesseractMat = new THREE.LineBasicMaterial({
        color: COLOR_PINK,
        linewidth: 2,
      });
      disposables.push(tesseractGeo, tesseractMat);
      const tesseractLines = new THREE.LineSegments(tesseractGeo, tesseractMat);
      devGroup.add(tesseractLines);

      // Corner Vertex Spheres
      const cornerGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
      const cornerMat = new THREE.MeshBasicMaterial({ color: COLOR_WHITE });
      disposables.push(cornerGeo, cornerMat);

      const cornerMeshes: THREE.Mesh[] = [];
      for (let i = 0; i < 16; i++) {
        const cornerMesh = new THREE.Mesh(cornerGeo, cornerMat);
        cornerMeshes.push(cornerMesh);
        devGroup.add(cornerMesh);
      }

      // Central Isometric Brutalist Plate
      const plateGeo = new THREE.BoxGeometry(1.6, 1.6, 0.08);
      const plateMat = new THREE.MeshStandardMaterial({
        color: COLOR_DARK,
        roughness: 0.1,
        metalness: 0.8,
        wireframe: false,
      });
      disposables.push(plateGeo, plateMat);
      const plateMesh = new THREE.Mesh(plateGeo, plateMat);
      devGroup.add(plateMesh);

      // 4D Rotation angles: XW and ZW planes
      onTick = (time) => {
        const thetaXW = time * 0.9;
        const thetaZW = time * 0.6;
        const cosXW = Math.cos(thetaXW);
        const sinXW = Math.sin(thetaXW);
        const cosZW = Math.cos(thetaZW);
        const sinZW = Math.sin(thetaZW);

        const dDistance = 2.4;
        const projected3D: THREE.Vector3[] = [];

        // Project 4D to 3D with perspective
        for (let i = 0; i < base4DVertices.length; i++) {
          let [x, y, z, w] = base4DVertices[i];

          // Rotate in XW plane
          const xRot = x * cosXW - w * sinXW;
          const wRot = x * sinXW + w * cosXW;

          // Rotate in ZW plane
          const zRot = z * cosZW - wRot * sinZW;
          const wRot2 = z * sinZW + wRot * cosZW;

          // Perspective divide from 4D to 3D
          const factor = 1 / (dDistance - wRot2 * 0.5);
          const pX = xRot * factor * 2.8;
          const pY = y * factor * 2.8;
          const pZ = zRot * factor * 2.8;

          const pVec = new THREE.Vector3(pX, pY, pZ);
          projected3D.push(pVec);

          // Position corner cubes
          cornerMeshes[i].position.copy(pVec);
        }

        // Update edges buffer
        const positions = tesseractGeo.attributes.position.array as Float32Array;
        let pIdx = 0;
        for (let e = 0; e < edges4D.length; e++) {
          const p1 = projected3D[edges4D[e][0]];
          const p2 = projected3D[edges4D[e][1]];

          positions[pIdx++] = p1.x;
          positions[pIdx++] = p1.y;
          positions[pIdx++] = p1.z;

          positions[pIdx++] = p2.x;
          positions[pIdx++] = p2.y;
          positions[pIdx++] = p2.z;
        }
        tesseractGeo.attributes.position.needsUpdate = true;

        plateMesh.rotation.x = time * 0.5;
        plateMesh.rotation.y = time * 0.7;
      };
    }

    // -------------------------------------------------------------
    // 5. MARKETING: Conversion Funnel Vortex & Velocity Growth Stream
    // -------------------------------------------------------------
    else {
      const marketingGroup = new THREE.Group();
      rootGroup.add(marketingGroup);

      // Hyperbolic Funnel Rings (Constructing wireframe funnel)
      const funnelLevels = 7;
      for (let i = 0; i < funnelLevels; i++) {
        const ratio = i / (funnelLevels - 1);
        const radius = 0.5 + Math.pow(ratio, 1.8) * 2.8;
        const yPos = -1.8 + ratio * 3.6;

        const ringGeo = new THREE.TorusGeometry(radius, 0.05, 12, 48);
        const ringMat = new THREE.MeshBasicMaterial({
          color: COLOR_ORANGE,
          wireframe: true,
        });
        disposables.push(ringGeo, ringMat);
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = yPos;
        marketingGroup.add(ring);
      }

      // Vertical Growth Trajectory Vector (Central Core Beam)
      const beamGeo = new THREE.CylinderGeometry(0.12, 0.12, 4.4, 16);
      const beamMat = new THREE.MeshStandardMaterial({
        color: COLOR_WHITE,
        emissive: COLOR_ORANGE,
        emissiveIntensity: 0.6,
      });
      disposables.push(beamGeo, beamMat);
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      marketingGroup.add(beamMesh);

      // Trajectory Arrow Tip (Exponential growth indicator)
      const arrowGeo = new THREE.ConeGeometry(0.4, 0.8, 16);
      const arrowMat = new THREE.MeshStandardMaterial({
        color: COLOR_YELLOW,
      });
      disposables.push(arrowGeo, arrowMat);
      const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
      arrowMesh.position.y = 2.4;
      marketingGroup.add(arrowMesh);

      // Swirling Particles Vortex (Conversion Hype Stream)
      const particleCount = 140;
      const particleGeo = new THREE.BufferGeometry();
      const particlePositions = new Float32Array(particleCount * 3);
      const particleData: { angle: number; heightRatio: number; speed: number }[] = [];

      for (let i = 0; i < particleCount; i++) {
        const heightRatio = Math.random();
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.5;
        particleData.push({ angle, heightRatio, speed });

        const radius = 0.5 + Math.pow(heightRatio, 1.8) * 2.8;
        const x = Math.cos(angle) * radius;
        const y = -1.8 + heightRatio * 3.6;
        const z = Math.sin(angle) * radius;

        particlePositions[i * 3] = x;
        particlePositions[i * 3 + 1] = y;
        particlePositions[i * 3 + 2] = z;
      }

      particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
      const particleMat = new THREE.PointsMaterial({
        color: COLOR_YELLOW,
        size: 0.12,
        transparent: true,
        opacity: 0.9,
      });
      disposables.push(particleGeo, particleMat);
      const particles = new THREE.Points(particleGeo, particleMat);
      marketingGroup.add(particles);

      onTick = (time, delta) => {
        // Swirl particles through funnel
        const positions = particleGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          const p = particleData[i];
          p.heightRatio = (p.heightRatio + delta * p.speed * 0.4) % 1;
          p.angle += delta * (2.0 + (1 - p.heightRatio) * 4.0); // Spun faster near base

          const radius = 0.5 + Math.pow(p.heightRatio, 1.8) * 2.8;
          positions[i * 3] = Math.cos(p.angle) * radius;
          positions[i * 3 + 1] = -1.8 + p.heightRatio * 3.6;
          positions[i * 3 + 2] = Math.sin(p.angle) * radius;
        }
        particleGeo.attributes.position.needsUpdate = true;

        // Arrow vertical pulse
        arrowMesh.position.y = 2.4 + Math.sin(time * 5) * 0.15;
      };
    }

    // -------------------------------------------------------------
    // Mouse Drag / Pointer Interaction for Orbiting
    // -------------------------------------------------------------
    let targetRotationX = 0;
    let targetRotationY = 0;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let isPointerDown = false;

    const onPointerDown = (e: PointerEvent) => {
      if (!interactive) return;
      isPointerDown = true;
      setIsDragging(true);
      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;
      const deltaX = e.clientX - pointerStartX;
      const deltaY = e.clientY - pointerStartY;
      targetRotationY += deltaX * 0.008;
      targetRotationX += deltaY * 0.008;
      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
    };

    const onPointerUp = () => {
      isPointerDown = false;
      setIsDragging(false);
    };

    const domElement = renderer.domElement;
    domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // -------------------------------------------------------------
    // Resize Handler
    // -------------------------------------------------------------
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth === 0 || newHeight === 0) return;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    // -------------------------------------------------------------
    // Intersection Observer to prevent 0-progress CPU spinning
    // -------------------------------------------------------------
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // -------------------------------------------------------------
    // Animation Loop
    // -------------------------------------------------------------
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Smooth interpolation for mouse drag rotation
      rootGroup.rotation.y += (targetRotationY - rootGroup.rotation.y) * 0.1;
      rootGroup.rotation.x += (targetRotationX - rootGroup.rotation.x) * 0.1;

      // Base auto rotation when not dragging
      if (autoRotate && !isPointerDown) {
        rootGroup.rotation.y += delta * 0.35;
      }

      onTick(elapsedTime, delta);

      renderer.render(scene, camera);
    };

    animate();

    // -------------------------------------------------------------
    // Teardown & Resource Hygiene
    // -------------------------------------------------------------
    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);

      disposables.forEach((item) => {
        if ("dispose" in item && typeof item.dispose === "function") {
          item.dispose();
        }
      });

      renderer.dispose();
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [role, wireframeOnly, autoRotate, interactive]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden select-none cursor-grab active:cursor-grabbing ${className}`}
      style={{ height }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Interactive Helper Cue */}
      {interactive && (
        <div
          className={`absolute bottom-2 right-2 pointer-events-none transition-opacity duration-300 font-mono text-[10px] uppercase font-bold px-2 py-0.5 border border-[#0F0F0F] bg-white text-[#0F0F0F] shadow-[2px_2px_0px_#0F0F0F] z-10 ${
            isHovered || isDragging ? "opacity-100" : "opacity-40"
          }`}
        >
          {isDragging ? "DRAGGING 3D" : "DRAG TO ROTATE"}
        </div>
      )}
    </div>
  );
}
