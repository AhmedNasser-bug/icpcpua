import * as THREE from "three";
import { createRoleScene, type Role3DType, type SceneDisposable } from "./role-scenes";

export interface MountRoleSceneOptions {
  role: Role3DType | string;
  wireframeOnly: boolean;
  autoRotate: boolean;
  interactive: boolean;
  /** Notifies the host component when a drag interaction starts or ends. */
  onDraggingChange: (dragging: boolean) => void;
}

/**
 * Builds the Three.js scene for a role inside `container` and starts the
 * render loop. Returns a teardown function that releases every GPU resource
 * and listener created here.
 */
export function mountRoleScene(
  container: HTMLDivElement,
  { role, wireframeOnly, autoRotate, interactive, onDraggingChange }: MountRoleSceneOptions
): () => void {
  let animationFrameId: number;
  let isVisible = true;

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
  const disposables: SceneDisposable[] = [];

  // Build the procedural model for the selected role
  const { group, tick: onTick } = createRoleScene(role, wireframeOnly, disposables);
  rootGroup.add(group);

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
    onDraggingChange(true);
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
    onDraggingChange(false);
  };

  const domElement = renderer.domElement;
  domElement.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);

  // -------------------------------------------------------------
  // Resize Handler
  // -------------------------------------------------------------
  const handleResize = () => {
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
    container.innerHTML = "";
  };
}
