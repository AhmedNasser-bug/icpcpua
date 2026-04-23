"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function EcosystemGraph() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        
        // Scene setup
        const scene = new THREE.Scene();
        // Transparent background
        scene.background = null; 
        
        const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(renderer.domElement);

        // Core Node (Pharos)
        const geometry = new THREE.IcosahedronGeometry(2, 0);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x7B2CBF, 
            wireframe: true,
            wireframeLinewidth: 2 
        });
        const coreNode = new THREE.Mesh(geometry, material);
        scene.add(coreNode);

        // Particles
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 200;
        const posArray = new Float32Array(particlesCount * 3);
        
        for(let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 15;
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.05,
            color: 0x00E5FF
        });
        
        const particlesMesh = new THREE.Points(particlesGeometry, particleMaterial);
        scene.add(particlesMesh);

        camera.position.z = 5;

        // Animation Loop
        const animate = () => {
            requestAnimationFrame(animate);
            coreNode.rotation.x += 0.005;
            coreNode.rotation.y += 0.005;
            
            particlesMesh.rotation.y -= 0.001;
            
            renderer.render(scene, camera);
        };
        
        animate();

        // Handle Resize
        const handleResize = () => {
            if (!containerRef.current) return;
            camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        };
        
        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, []);

    return (
        <div className="relative w-full h-[400px] border-[3px] border-[#0F0F0F] bg-black shadow-[8px_8px_0px_0px_#0F0F0F] overflow-hidden group">
            {/* The Three JS Canvas */}
            <div ref={containerRef} className="absolute inset-0 z-0"></div>
            
            {/* CSS Nodes overlay layer */}
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                <div className="relative w-full h-full max-w-4xl">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-black px-4 py-2 border-[3px] border-black font-black uppercase text-2xl tracking-tighter flex items-center gap-2 shadow-[4px_4px_0px_0px_#0F0F0F]">
                        <span className="material-symbols-outlined font-variation-settings-fill-1">hub</span>
                        THE CORE
                    </div>
                    {/* Connecting lines via CSS SVG could go here */}
                    <div className="absolute top-10 left-10 bg-[#FFD500] text-black px-2 py-1 border-[3px] border-black font-bold uppercase shadow-[4px_4px_0px_0px_#0F0F0F] flex items-center gap-1">
                        NODE: ALGO
                    </div>
                    <div className="absolute bottom-10 right-10 bg-[#00E5FF] text-black px-2 py-1 border-[3px] border-black font-bold uppercase shadow-[4px_4px_0px_0px_#0F0F0F] flex items-center gap-1">
                        NODE: ENG
                    </div>
                </div>
            </div>
            
            {/* Vector details */}
            <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-20 -top-[6px] -left-[6px]"></div>
            <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-20 -top-[6px] -right-[6px]"></div>
            <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-20 -bottom-[6px] -left-[6px]"></div>
            <div className="absolute w-3 h-3 bg-white border-[3px] border-[#0F0F0F] z-20 -bottom-[6px] -right-[6px]"></div>
        </div>
    );
}
