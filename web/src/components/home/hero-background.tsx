"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

const IMG_URL =
  "https://images.unsplash.com/photo-1507153501670-d68ec3a8cb5b?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

const IMG_RATIO = 1170 / 780;
const TARGET_CAMERA_Z = 180;
const INSTANCE_SIZE = 1;
const RAND_RANGE_Z = 2 * TARGET_CAMERA_Z * 0.99;
const INIT_CAMERA_Z = TARGET_CAMERA_Z / 5;

function f(x: number, y: number, targetZ: number) {
  const h = 0.5;
  const d = TARGET_CAMERA_Z;
  const D = -targetZ + d;
  const H = (h / d) * D;
  const s = H / h;
  return { s, p: new THREE.Vector3(x * s, y * s, targetZ) };
}

/**
 * 3D pixel-particle hero background.
 * Renders an image as a grid of cubes in 3D space.
 * Camera moves forward on scroll (GSAP-animated).
 */
export function HeroBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Renderer ─────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = "fixed";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.width = "100vw";
    renderer.domElement.style.height = "100vh";
    container.appendChild(renderer.domElement);

    // ── Scene & Camera ───────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.5,
      1000,
    );
    camera.position.set(0, 0, INIT_CAMERA_Z);

    // ── Instanced Mesh ───────────────────────────────────
    const nRow = 256;
    const nCol = (nRow * IMG_RATIO) | 0;
    const sz = INSTANCE_SIZE;

    const geom = new THREE.BoxGeometry(sz, sz, sz).translate(0, 0, -0.5 * sz);
    const mat = new THREE.MeshBasicMaterial();
    const mesh = new THREE.InstancedMesh(geom, mat, nCol * nRow);

    for (let i = 0, c = 0; i < nRow; ++i) {
      for (let j = 0; j < nCol; ++j) {
        const { p, s } = f(
          (j - nCol / 2 + 0.5) * sz,
          (nRow / 2 - i + 0.5) * sz,
          THREE.MathUtils.randFloatSpread(RAND_RANGE_Z) * sz,
        );
        const m = new THREE.Matrix4()
          .setPosition(p)
          .multiply(new THREE.Matrix4().makeScale(s, s, s));
        mesh.setMatrixAt(c, m);
        mesh.setColorAt(c, new THREE.Color("white"));
        ++c;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor!.needsUpdate = true;
    scene.add(mesh);

    // ── Load image & color cubes ─────────────────────────
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const { width, height } = img;
      const can = document.createElement("canvas");
      can.height = 256;
      can.width = (can.height * IMG_RATIO) | 0;
      const ctx = can.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height, 0, 0, can.width, can.height);
      const { data } = ctx.getImageData(0, 0, can.width, can.height);
      const c = new THREE.Color();
      const total = data.length >> 2;
      for (let i = 0; i < total; ++i) {
        mesh.setColorAt(
          i,
          c.setRGB(
            data[i * 4] / 255,
            data[i * 4 + 1] / 255,
            data[i * 4 + 2] / 255,
          ),
        );
      }
      mesh.instanceColor!.needsUpdate = true;
    };
    img.src = IMG_URL;

    // ── Animation loop ───────────────────────────────────
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    // ── Resize ───────────────────────────────────────────
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    // ── Scroll → camera Z ────────────────────────────────
    const onScroll = () => {
      const H = document.documentElement.offsetHeight - window.innerHeight;
      const r = H > 0 ? window.scrollY / H : 0;
      const z = INIT_CAMERA_Z + (TARGET_CAMERA_Z - INIT_CAMERA_Z) * r;
      gsap.killTweensOf(camera.position);
      gsap.to(camera.position, { z, duration: 0.4, ease: "power2.out" });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // ── Cleanup ──────────────────────────────────────────
    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      geom.dispose();
      mat.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
