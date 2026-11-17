"use client";

import { useEffect, useRef, useState } from "react";
import type * as THREE from "three";

export type DeskSceneProps = {
  onOpen: (id: string) => void;
  night: boolean;
  reducedMotion: boolean;
  resetKey: number;
  onHover?: (label: string | null) => void;
};

type Controls = {
  light: (value: boolean) => void;
  reset: () => void;
  motion: (value: boolean) => void;
};

export default function DeskScene({
  onOpen,
  night,
  reducedMotion,
  resetKey,
  onHover,
}: DeskSceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onOpen, onHover });
  const controls = useRef<Controls | null>(null);
  const preferences = useRef({ night, reducedMotion });
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    callbacks.current = { onOpen, onHover };
  }, [onOpen, onHover]);
  useEffect(() => {
    preferences.current.night = night;
    controls.current?.light(night);
  }, [night]);
  useEffect(() => {
    preferences.current.reducedMotion = reducedMotion;
    controls.current?.motion(reducedMotion);
  }, [reducedMotion]);
  useEffect(() => {
    controls.current?.reset();
  }, [resetKey]);

  useEffect(() => {
    let alive = true;
    let cleanup = () => {};
    const container = host.current;
    if (!container) return;

    async function createScene() {
      const [T, { RoundedBoxGeometry }] = await Promise.all([
        import("three"),
        import("three/addons/geometries/RoundedBoxGeometry.js"),
      ]);
      if (!alive || !container) return;
      const renderer = new T.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "low-power",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFShadowMap;
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.style.cssText =
        "display:block;width:100%;height:100%;touch-action:pan-y";
      container.appendChild(renderer.domElement);
      const scene = new T.Scene();
      scene.background = new T.Color("#b6a691");
      const camera = new T.OrthographicCamera(-7.5, 7.5, 5, -5, 0.1, 100);
      const target = new T.Vector3(0, 0.5, 0);
      const initialCamera = new T.Vector3(0, 13.5, 12);
      camera.position.copy(initialCamera);
      camera.lookAt(target);
      const interactive: THREE.Object3D[] = [];
      const objects = new Map<string, THREE.Group>();
      const originalPositions = new Map<THREE.Object3D, THREE.Vector3>();
      const resources = new Set<THREE.Texture>();
      const disposeScene = () => {
        const geometries = new Set<THREE.BufferGeometry>(),
          materials = new Set<THREE.Material>();
        scene.traverse((item) => {
          const mesh = item as THREE.Mesh;
          if (mesh.geometry) geometries.add(mesh.geometry);
          if (mesh.material)
            for (const mat of Array.isArray(mesh.material)
              ? mesh.material
              : [mesh.material])
              materials.add(mat);
        });
        geometries.forEach((item) => item.dispose());
        materials.forEach((item) => item.dispose());
        resources.forEach((item) => item.dispose());
        renderer.dispose();
        renderer.domElement.remove();
        controls.current = null;
      };
      cleanup = disposeScene;
      let frame = 0;
      let mobile = false;
      let isReduced = preferences.current.reducedMotion;
      let pointerX = 0,
        pointerY = 0;
      let framesToSettle = 0;
      let cubeAngle = 0;

      const material = (color: string, roughness = 0.65, metalness = 0) =>
        new T.MeshStandardMaterial({ color, roughness, metalness });
      const graphite = material("#252628", 0.5, 0.2);
      const graphiteLight = material("#393b3e", 0.55, 0.2);
      const graphiteDark = material("#151719", 0.72);
      const brass = material("#b39b65", 0.4, 0.65);
      const ivory = material("#f6ebd5", 0.88);
      const copper = material("#794a3b", 0.88, 0.03);
      const paper = material("#f8f1dc", 0.9);
      function rounded(
        w: number,
        h: number,
        d: number,
        mat: THREE.Material,
        radius = 0.06,
      ) {
        const mesh = new T.Mesh(
          new RoundedBoxGeometry(
            w,
            h,
            d,
            3,
            Math.min(radius, w / 3, h / 3, d / 3),
          ),
          mat,
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
      }
      function box(
        group: THREE.Object3D,
        w: number,
        h: number,
        d: number,
        mat: THREE.Material,
        x = 0,
        y = 0,
        z = 0,
        r = 0.06,
      ) {
        const mesh = rounded(w, h, d, mat, r);
        mesh.position.set(x, y, z);
        group.add(mesh);
        return mesh;
      }
      function cylinder(
        group: THREE.Object3D,
        top: number,
        bottom: number,
        height: number,
        mat: THREE.Material,
        x: number,
        y: number,
        z: number,
      ) {
        const mesh = new T.Mesh(
          new T.CylinderGeometry(top, bottom, height, 40),
          mat,
        );
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
        return mesh;
      }
      function rod(
        group: THREE.Object3D,
        start: THREE.Vector3,
        end: THREE.Vector3,
        radius: number,
        mat: THREE.Material,
      ) {
        const delta = end.clone().sub(start);
        const mesh = new T.Mesh(
          new T.CylinderGeometry(radius, radius, delta.length(), 12),
          mat,
        );
        mesh.position.copy(start.clone().add(end).multiplyScalar(0.5));
        mesh.quaternion.setFromUnitVectors(
          new T.Vector3(0, 1, 0),
          delta.normalize(),
        );
        mesh.castShadow = true;
        group.add(mesh);
        return mesh;
      }
      function canvasTexture(
        width: number,
        height: number,
        draw: (ctx: CanvasRenderingContext2D) => void,
      ) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas unavailable");
        draw(ctx);
        const texture = new T.CanvasTexture(canvas);
        texture.colorSpace = T.SRGBColorSpace;
        texture.anisotropy = Math.min(
          8,
          renderer.capabilities.getMaxAnisotropy(),
        );
        resources.add(texture);
        return { texture, canvas, ctx };
      }
      function flatTexture(
        group: THREE.Object3D,
        texture: THREE.Texture,
        w: number,
        d: number,
        x = 0,
        y = 0.1,
        z = 0,
      ) {
        const mesh = new T.Mesh(
          new T.PlaneGeometry(w, d),
          new T.MeshStandardMaterial({
            map: texture,
            roughness: 0.9,
            alphaTest: 0.02,
          }),
        );
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x, y, z);
        mesh.receiveShadow = true;
        group.add(mesh);
        return mesh;
      }
      function object(id: string, label: string) {
        const group = new T.Group();
        group.userData = { action: id, label };
        interactive.push(group);
        objects.set(id, group);
        scene.add(group);
        return group;
      }

      const wood = canvasTexture(1024, 1024, (ctx) => {
        ctx.fillStyle = "#cec7bc";
        ctx.fillRect(0, 0, 1024, 1024);
        const pixels = ctx.getImageData(0, 0, 1024, 1024);
        let seed = 83;
        for (let i = 0; i < pixels.data.length; i += 4) {
          seed = (seed * 16807) % 2147483647;
          const noise = (seed / 2147483647 - 0.5) * 5;
          pixels.data[i] += noise;
          pixels.data[i + 1] += noise;
          pixels.data[i + 2] += noise;
        }
        ctx.putImageData(pixels, 0, 0);
        for (let i = 0; i < 100; i++) {
          const y = i * 10.4;
          ctx.strokeStyle =
            i % 3 ? "rgba(118,105,86,.035)" : "rgba(255,251,241,.07)";
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          for (let x = 0; x <= 1050; x += 16) {
            const py = y + Math.sin((x * Math.PI * 2) / 1024 + i * 0.7) * 4;
            if (x === 0) ctx.moveTo(x, py);
            else ctx.lineTo(x, py);
          }
          ctx.stroke();
        }
      });
      wood.texture.wrapS = wood.texture.wrapT = T.RepeatWrapping;
      wood.texture.repeat.set(2, 2);
      const deskMat = new T.MeshStandardMaterial({
        map: wood.texture,
        color: "#ffffff",
        bumpMap: wood.texture,
        bumpScale: 0.015,
        roughness: 0.94,
      });
      const desk = box(scene, 40, 0.4, 28, deskMat, 0, -0.35, 0, 0.1);
      desk.castShadow = false;
      const pad = box(
        scene,
        6.7,
        0.065,
        5.6,
        material("#323438", 0.98),
        0.05,
        -0.08,
        0.2,
        0.12,
      );
      pad.rotation.y = -0.025;
      // An edge stitch gives the desk mat thickness at grazing light.
      const seam = new T.LineLoop(
        new T.BufferGeometry().setFromPoints([
          new T.Vector3(-3.2, -0.04, -2.42),
          new T.Vector3(3.3, -0.04, -2.42),
          new T.Vector3(3.3, -0.04, 2.85),
          new T.Vector3(-3.2, -0.04, 2.85),
        ]),
        new T.LineBasicMaterial({ color: "#726e63" }),
      );
      scene.add(seam);

      // Laptop, including an actual hinge, recessed keyboard, glass, feet and stickers.
      const laptop = object("cv", "Open my one-page CV");
      laptop.rotation.y = -0.075;
      laptop.position.set(0, 0.02, 0.3);
      box(laptop, 4.7, 0.19, 3.15, graphiteLight, 0, 0.12, 0, 0.1);
      box(laptop, 4.72, 0.035, 3.12, graphiteDark, 0, 0.04, 0, 0.05);
      box(laptop, 4.15, 0.035, 1.55, graphiteDark, 0, 0.229, -0.53, 0.06);
      const keyMat = material("#292c30", 0.88);
      for (let row = 0; row < 4; row++)
        for (let col = 0; col < 13; col++)
          box(
            laptop,
            0.26,
            0.045,
            0.27,
            keyMat,
            -1.86 + col * 0.31,
            0.26,
            -1.08 + row * 0.34,
            0.025,
          );
      const keyLegend = canvasTexture(1660, 620, (ctx) => {
        const rows = [
          [
            "esc",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "0",
            "del",
            "back",
          ],
          ["tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]"],
          [
            "caps",
            "A",
            "S",
            "D",
            "F",
            "G",
            "H",
            "J",
            "K",
            "L",
            ";",
            "'",
            "enter",
          ],
          [
            "shift",
            "Z",
            "X",
            "C",
            "V",
            "B",
            "N",
            "M",
            ",",
            ".",
            "/",
            "shift",
            "up",
          ],
        ];
        ctx.fillStyle = "#c7cbc9";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        rows.forEach((row, r) =>
          row.forEach((key, c) => {
            ctx.font = `${key.length > 1 ? 24 : 36}px Arial`;
            ctx.fillText(
              key,
              ((-1.86 + c * 0.31 + 2.075) / 4.15) * 1660,
              ((-1.08 + r * 0.34 + 1.305) / 1.55) * 620,
            );
          }),
        );
      });
      flatTexture(laptop, keyLegend.texture, 4.15, 1.55, 0, 0.286, -0.53);
      box(laptop, 1.7, 0.042, 0.23, keyMat, 0, 0.26, 0.28, 0.025);
      box(
        laptop,
        1.55,
        0.015,
        0.77,
        material("#46494d", 0.64, 0.1),
        0,
        0.224,
        0.95,
        0.06,
      );
      const hinge = cylinder(
        laptop,
        0.105,
        0.105,
        4.15,
        graphiteDark,
        0,
        0.26,
        -1.43,
      );
      hinge.rotation.z = Math.PI / 2;
      const lid = new T.Group();
      lid.position.set(0, 0.27, -1.43);
      lid.rotation.x = -0.12;
      laptop.add(lid);
      box(lid, 4.7, 3.05, 0.145, graphite, 0, 1.51, 0, 0.11);
      const screenDraw = canvasTexture(1400, 880, (ctx) => {
        ctx.fillStyle = "#eeeae2";
        ctx.fillRect(0, 0, 1400, 880);
        ctx.fillStyle = "#787872";
        ctx.font = "30px Arial";
        ctx.fillText("STUDENT PORTFOLIO", 78, 83);
        ctx.fillStyle = "#272b2d";
        ctx.font = "bold 87px Arial";
        ctx.fillText("Aruzhan Maratova", 70, 210);
        ctx.font = "35px Arial";
        ctx.fillStyle = "#30383d";
        ctx.fillText("Cybersecurity, software and robotics", 78, 277);
        const projectRows = [
          ["VOX / Suerte", "Voice control for clinical systems"],
          ["CIPH3R", "IP and domain tools"],
          ["ARAL WATCH", "CubeSat prototype with Team AXIS"],
        ];
        projectRows.forEach(([name, detail], i) => {
          const y = 385 + i * 88;
          ctx.strokeStyle = "#d1d0c8";
          ctx.beginPath();
          ctx.moveTo(78, y - 47);
          ctx.lineTo(1320, y - 47);
          ctx.stroke();
          ctx.fillStyle = "#303638";
          ctx.font = "bold 31px Arial";
          ctx.fillText(name, 78, y);
          ctx.fillStyle = "#2b3236";
          ctx.font = "32px Arial";
          ctx.fillText(detail, 465, y);
        });
        ctx.fillStyle = "#30383c";
        ctx.beginPath();
        ctx.roundRect(75, 650, 450, 110, 10);
        ctx.fill();
        ctx.fillStyle = "#f8f3e9";
        ctx.font = "bold 36px Arial";
        ctx.fillText("Read my CV", 126, 718);
        ctx.font = "25px Arial";
        ctx.fillStyle = "#343b3b";
        ctx.fillText("Aktobe, Kazakhstan", 78, 826);
        ctx.fillText("Class of 2027", 1110, 826);
      });
      const screenMaterial = new T.MeshStandardMaterial({
        map: screenDraw.texture,
        emissiveMap: screenDraw.texture,
        emissive: "#ffffff",
        emissiveIntensity: 0.28,
        roughness: 0.4,
      });
      const screen = new T.Mesh(
        new T.PlaneGeometry(4.38, 2.75),
        screenMaterial,
      );
      screen.position.set(0, 1.52, 0.082);
      lid.add(screen);
      const webcam = new T.Mesh(
        new T.SphereGeometry(0.021, 8, 8),
        graphiteDark,
      );
      webcam.position.set(0, 2.98, 0.08);
      lid.add(webcam);
      const sticker = (
        text: string[],
        bg: string,
        fg: string,
        x: number,
        z: number,
        angle: number,
        w: number,
        d: number,
      ) => {
        const image = canvasTexture(320, 190, (ctx) => {
          ctx.fillStyle = "#f7edce";
          ctx.fillRect(0, 0, 320, 190);
          ctx.fillStyle = bg;
          ctx.fillRect(8, 8, 304, 174);
          ctx.fillStyle = fg;
          ctx.textAlign = "center";
          ctx.font = "bold 51px Arial";
          text.forEach((s, i) => ctx.fillText(s, 160, 74 + i * 58));
        });
        const plane = flatTexture(laptop, image.texture, w, d, x, 0.232, z);
        plane.rotation.z = angle;
      };
      sticker(
        ["OUT OF", "BOUNDS"],
        "#863e32",
        "#fff2d5",
        -1.66,
        0.99,
        0.13,
        0.91,
        0.56,
      );
      const pandaArt = canvasTexture(320, 360, (ctx) => {
        ctx.fillStyle = "#ebe8dc";
        ctx.beginPath();
        ctx.roundRect(15, 15, 290, 330, 55);
        ctx.fill();
        ctx.fillStyle = "#2a2e31";
        for (const x of [76, 244]) {
          ctx.beginPath();
          ctx.arc(x, 126, 40, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "#fbf8ed";
        ctx.beginPath();
        ctx.ellipse(160, 211, 102, 107, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2a2e31";
        for (const [x, angle] of [
          [116, 0.25],
          [204, -0.25],
        ]) {
          ctx.beginPath();
          ctx.ellipse(x, 212, 29, 36, angle, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "#faf8ed";
        for (const x of [122, 198]) {
          ctx.beginPath();
          ctx.arc(x, 208, 7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "#2a2e31";
        ctx.beginPath();
        ctx.ellipse(160, 258, 15, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#2a2e31";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(160, 267);
        ctx.quadraticCurveTo(160, 280, 146, 280);
        ctx.moveTo(160, 267);
        ctx.quadraticCurveTo(160, 280, 174, 280);
        ctx.stroke();
        ctx.fillStyle = "#5d7081";
        ctx.beginPath();
        ctx.ellipse(160, 111, 91, 64, 0, Math.PI, 0);
        ctx.lineTo(251, 154);
        ctx.lineTo(69, 154);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#7d91a0";
        ctx.beginPath();
        ctx.roundRect(62, 127, 196, 40, 14);
        ctx.fill();
        ctx.strokeStyle = "#566c7e";
        ctx.lineWidth = 3;
        for (let x = 78; x < 250; x += 14) {
          ctx.beginPath();
          ctx.moveTo(x, 135);
          ctx.lineTo(x, 159);
          ctx.stroke();
        }
        ctx.fillStyle = "#7d91a0";
        ctx.beginPath();
        ctx.arc(160, 48, 24, 0, Math.PI * 2);
        ctx.fill();
      });
      const pandaSticker = flatTexture(
        laptop,
        pandaArt.texture,
        0.63,
        0.7,
        1.76,
        0.233,
        0.94,
      );
      pandaSticker.rotation.z = -0.13;
      function photograph(
        id: string,
        label: string,
        src: string,
        caption: string,
        x: number,
        z: number,
        angle: number,
        width: number,
        height: number,
      ) {
        const group = object(id, label);
        group.userData.draggable = true;
        group.position.set(x, 0.035, z);
        group.rotation.y = angle;
        box(group, width, 0.045, height, paper, 0, 0, 0, 0.015);
        const image = canvasTexture(900, 1100, (ctx) => {
          ctx.fillStyle = "#fbf3df";
          ctx.fillRect(0, 0, 900, 1100);
          ctx.fillStyle = "#d2c8b4";
          ctx.fillRect(35, 35, 830, 855);
          ctx.fillStyle = "#403d30";
          ctx.font = "italic 60px Georgia";
          ctx.fillText(caption, 55, 1015);
        });
        flatTexture(group, image.texture, width, height, 0, 0.025, 0);
        const img = new Image();
        img.onload = () => {
          if (!alive) return;
          const targetW = 830,
            targetH = 855;
          const scale = Math.max(targetW / img.width, targetH / img.height);
          const sw = targetW / scale,
            sh = targetH / scale;
          image.ctx.drawImage(
            img,
            (img.width - sw) / 2,
            (img.height - sh) * 0.3,
            sw,
            sh,
            35,
            35,
            targetW,
            targetH,
          );
          image.texture.needsUpdate = true;
          requestRender();
        };
        img.src = src;
        originalPositions.set(group, group.position.clone());
        return group;
      }
      const photoWork = photograph(
        "about",
        "A little about me",
        "/images/aruzhan-at-work.jpg",
        "Usually here.",
        -4.05,
        0.25,
        0.19,
        2.35,
        2.8,
      );
      const photoAward = photograph(
        "photos",
        "Competition photographs",
        "/images/kazhackstan.jpg",
        "KazHackStan 2026",
        3.8,
        -1.7,
        -0.2,
        2.05,
        2.55,
      );
      // Semi-translucent masking tape across one photograph.
      const tape = box(
        photoWork,
        1.2,
        0.008,
        0.29,
        new T.MeshStandardMaterial({
          color: "#c6b58b",
          roughness: 1,
          transparent: true,
          opacity: 0.73,
        }),
        0,
        0.033,
        -1.37,
        0.004,
      );
      tape.rotation.y = -0.1;

      const notebook = object("work", "Open my projects");
      notebook.position.set(3.85, 0.08, 1.78);
      notebook.rotation.y = -0.16;
      box(
        notebook,
        2.35,
        0.16,
        2.9,
        material("#d3c8af", 0.97),
        0,
        0.08,
        0,
        0.025,
      );
      box(notebook, 2.4, 0.04, 2.98, copper, 0, 0.18, 0, 0.03);
      box(notebook, 2.4, 0.04, 2.98, copper, 0, -0.015, 0, 0.03);
      box(
        notebook,
        0.16,
        0.22,
        3,
        material("#7d3527", 0.8),
        -1.13,
        0.09,
        0,
        0.03,
      );
      const cover = canvasTexture(900, 1100, (ctx) => {
        ctx.fillStyle = "#794b3c";
        ctx.fillRect(0, 0, 900, 1100);
        ctx.fillStyle = "#e5d9c3";
        ctx.font = "24px Arial";
        ctx.fillText("ARUZHAN MARATOVA", 90, 125);
        ctx.font = "82px Georgia";
        ctx.fillText("Projects", 90, 375);
        ctx.fillText("and notes", 90, 480);
        ctx.strokeStyle = "#b6997d";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(90, 570);
        ctx.lineTo(790, 570);
        ctx.stroke();
        ctx.font = "35px Arial";
        ["Security", "Software", "Hardware", "Teaching"].forEach((s, i) =>
          ctx.fillText(s, 95, 690 + i * 70),
        );
      });
      flatTexture(notebook, cover.texture, 2.25, 2.85, 0.04, 0.205, 0);
      const pencil = new T.Group();
      scene.add(pencil);
      pencil.position.set(5.38, 0.09, 1.7);
      pencil.rotation.y = -0.16;
      const pbody = cylinder(
        pencil,
        0.055,
        0.055,
        2.7,
        material("#d4a457", 0.7),
        0,
        0,
        0,
      );
      pbody.rotation.x = Math.PI / 2;
      const ptip = new T.Mesh(
        new T.ConeGeometry(0.055, 0.29, 8),
        material("#c3ae84", 0.9),
      );
      ptip.rotation.x = Math.PI / 2;
      ptip.position.z = 1.49;
      pencil.add(ptip);

      const cube = object("cube", "Turn the Rubik’s cube");
      cube.position.set(-3.9, 0.64, 2.75);
      cube.rotation.set(0, 0.35, 0);
      const colors = [
        "#d89638",
        "#dcdebf",
        "#426d8f",
        "#b94733",
        "#5f8758",
        "#d4b94c",
      ];
      const cubieMaterial = material("#202c29", 0.55);
      for (let x = -1; x <= 1; x++)
        for (let y = -1; y <= 1; y++)
          for (let z = -1; z <= 1; z++) {
            const part = box(
              cube,
              0.38,
              0.38,
              0.38,
              cubieMaterial,
              x * 0.4,
              y * 0.4,
              z * 0.4,
              0.035,
            );
            const faces: [number, number, number, number, number][] = [];
            if (z === 1) faces.push([0, 0, 0.195, 0, 0]);
            if (y === 1) faces.push([0, 0.195, 0, -Math.PI / 2, 0]);
            if (x === 1) faces.push([0.195, 0, 0, 0, Math.PI / 2]);
            if (x === -1) faces.push([-0.195, 0, 0, 0, -Math.PI / 2]);
            faces.forEach(([fx, fy, fz, rx, ry], i) => {
              const tile = new T.Mesh(
                new T.PlaneGeometry(0.31, 0.31),
                material(
                  colors[(x + y * 2 + z * 3 + i * 2 + 30) % colors.length],
                  0.65,
                ),
              );
              tile.position.set(fx, fy, fz);
              tile.rotation.set(rx, ry, 0);
              part.add(tile);
            });
          }
      const satellite = object("aral-watch", "ARAL WATCH prototype");
      satellite.position.set(-4.45, 0.08, -2.6);
      satellite.rotation.y = -0.3;
      box(satellite, 0.9, 1.03, 0.9, brass, 0, 0.55, 0, 0.025);
      const circuit = material("#29483e", 0.7);
      box(satellite, 0.77, 0.79, 0.04, circuit, 0, 0.56, 0.47, 0.015);
      box(satellite, 0.35, 0.32, 0.06, graphiteDark, 0, 0.56, 0.5, 0.015);
      for (const side of [-1, 1]) {
        const panel = new T.Group();
        panel.position.set(side * 1.1, 0.6, 0);
        satellite.add(panel);
        box(panel, 1.2, 0.055, 0.85, brass, 0, 0, 0, 0.015);
        for (let a = 0; a < 4; a++)
          for (let b = 0; b < 3; b++)
            box(
              panel,
              0.255,
              0.012,
              0.232,
              material((a + b) % 2 ? "#233c54" : "#2c4764", 0.34, 0.25),
              -0.43 + a * 0.28,
              0.04,
              -0.26 + b * 0.26,
              0.004,
            );
      }
      rod(
        satellite,
        new T.Vector3(-0.2, 1.05, 0),
        new T.Vector3(-0.4, 1.9, 0),
        0.012,
        graphiteLight,
      );
      rod(
        satellite,
        new T.Vector3(0.2, 1.05, 0),
        new T.Vector3(0.6, 1.65, 0.1),
        0.012,
        graphiteLight,
      );

      const guitar = object("guitar", "A few guitar notes");
      guitar.position.set(5.8, 0.13, -0.7);
      guitar.rotation.y = -0.45;
      // A wooden guitar, partly outside the desktop crop, gives the scene a lived-in edge.
      const bodyShape = new T.Shape();
      bodyShape.moveTo(0, -0.8);
      bodyShape.bezierCurveTo(-0.75, -0.9, -1.0, -0.35, -0.7, 0.1);
      bodyShape.bezierCurveTo(-0.4, 0.45, -0.63, 0.65, -0.42, 0.95);
      bodyShape.bezierCurveTo(-0.2, 1.2, 0.2, 1.2, 0.42, 0.95);
      bodyShape.bezierCurveTo(0.63, 0.65, 0.4, 0.45, 0.7, 0.1);
      bodyShape.bezierCurveTo(1.0, -0.35, 0.75, -0.9, 0, -0.8);
      const body = new T.Mesh(
        new T.ExtrudeGeometry(bodyShape, {
          depth: 0.22,
          bevelEnabled: true,
          bevelSegments: 3,
          steps: 1,
          bevelSize: 0.04,
          bevelThickness: 0.04,
        }),
        material("#b18a52", 0.6),
      );
      body.rotation.x = -Math.PI / 2;
      body.castShadow = true;
      guitar.add(body);
      box(
        guitar,
        0.23,
        0.12,
        2.15,
        material("#593e28", 0.7),
        0,
        0.27,
        -1.85,
        0.025,
      );
      box(
        guitar,
        0.34,
        0.12,
        0.55,
        material("#785433", 0.6),
        0,
        0.27,
        -3.05,
        0.035,
      );
      const soundHole = new T.Mesh(
        new T.CircleGeometry(0.23, 30),
        graphiteDark,
      );
      soundHole.rotation.x = -Math.PI / 2;
      soundHole.position.set(0, 0.267, -0.3);
      guitar.add(soundHole);
      const rosette = new T.Mesh(new T.RingGeometry(0.24, 0.29, 30), brass);
      rosette.rotation.x = -Math.PI / 2;
      rosette.position.set(0, 0.268, -0.3);
      guitar.add(rosette);
      box(guitar, 0.48, 0.04, 0.1, graphiteDark, 0, 0.29, 0.42, 0.01);
      for (let i = 0; i < 6; i++)
        rod(
          guitar,
          new T.Vector3(-0.08 + i * 0.032, 0.35, 0.46),
          new T.Vector3(-0.08 + i * 0.032, 0.35, -3.12),
          0.0035,
          ivory,
        );
      for (let i = 0; i < 12; i++)
        box(
          guitar,
          0.23,
          0.007,
          0.012,
          brass,
          0,
          0.337,
          -0.92 - i * 0.16,
          0.002,
        );

      const headphones = object("music", "What I listen to");
      headphones.position.set(5.65, 0.04, -1.55);
      headphones.rotation.y = -0.28;
      const headbandPath = new T.CubicBezierCurve3(
        new T.Vector3(-0.82, 0.2, 0.35),
        new T.Vector3(-1.1, 0.18, -1.15),
        new T.Vector3(1.1, 0.18, -1.15),
        new T.Vector3(0.82, 0.2, 0.35),
      );
      const headband = new T.Mesh(
        new T.TubeGeometry(headbandPath, 48, 0.105, 12, false),
        material("#242a30", 0.75),
      );
      headband.castShadow = true;
      headphones.add(headband);
      const earLeather = material("#161b20", 0.92);
      for (const side of [-1, 1]) {
        const cup = new T.Group();
        cup.position.set(side * 0.82, 0.08, 0.4);
        cup.rotation.y = side * 0.14;
        headphones.add(cup);
        box(cup, 0.58, 0.2, 0.79, graphiteLight, 0, 0.08, 0, 0.095);
        const earPad = new T.Mesh(
          new T.TorusGeometry(0.26, 0.075, 16, 40),
          earLeather,
        );
        earPad.rotation.x = -Math.PI / 2;
        earPad.scale.set(0.77, 1.1, 1);
        earPad.position.y = 0.23;
        earPad.castShadow = true;
        cup.add(earPad);
        const earInner = new T.Mesh(new T.CircleGeometry(0.24, 32), earLeather);
        earInner.rotation.x = -Math.PI / 2;
        earInner.scale.set(0.75, 1.1, 1);
        earInner.position.y = 0.21;
        cup.add(earInner);
      }
      const tea = object("extras", "Tea and a few other things");
      tea.position.set(-5.8, -0.05, 2.2);
      tea.rotation.y = -0.4;
      const glaze = material("#cacbc5", 0.27, 0.03);
      cylinder(tea, 0.58, 0.5, 0.05, glaze, 0, 0.025, 0);
      const cupWall = new T.Mesh(
        new T.CylinderGeometry(0.36, 0.29, 0.58, 48, 1, true),
        glaze,
      );
      cupWall.position.y = 0.35;
      cupWall.castShadow = true;
      cupWall.receiveShadow = true;
      tea.add(cupWall);
      const teaSurface = new T.Mesh(
        new T.CircleGeometry(0.335, 48),
        material("#654c2c", 0.2),
      );
      teaSurface.rotation.x = -Math.PI / 2;
      teaSurface.position.y = 0.61;
      tea.add(teaSurface);
      const cupRim = new T.Mesh(
        new T.TorusGeometry(0.348, 0.023, 12, 48),
        glaze,
      );
      cupRim.rotation.x = -Math.PI / 2;
      cupRim.position.y = 0.645;
      tea.add(cupRim);
      const cupHandle = new T.Mesh(
        new T.TorusGeometry(0.19, 0.047, 12, 32),
        glaze,
      );
      cupHandle.position.set(0.36, 0.36, 0);
      cupHandle.castShadow = true;
      tea.add(cupHandle);

      const sudoku = object("sudoku", "Play Sudoku");
      sudoku.position.set(-5.45, -0.08, 3.8);
      sudoku.rotation.y = 0.1;
      box(sudoku, 1.22, 0.016, 1.6, paper, 0, 0, 0, 0.004);
      const sudokuArt = canvasTexture(900, 1160, (ctx) => {
        ctx.fillStyle = "#ede9de";
        ctx.fillRect(0, 0, 900, 1160);
        ctx.fillStyle = "#353b3e";
        ctx.font = "italic 85px Georgia";
        ctx.fillText("Sudoku", 75, 130);
        const startX = 72,
          startY = 225,
          size = 756,
          cell = size / 9;
        for (let i = 0; i <= 9; i++) {
          ctx.strokeStyle = i % 3 === 0 ? "#6b6e6b" : "#b2b5af";
          ctx.lineWidth = i % 3 === 0 ? 4 : 2;
          ctx.beginPath();
          ctx.moveTo(startX + i * cell, startY);
          ctx.lineTo(startX + i * cell, startY + size);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(startX, startY + i * cell);
          ctx.lineTo(startX + size, startY + i * cell);
          ctx.stroke();
        }
        const puzzle = [
          [5, 3, 0, 0, 7, 0, 0, 0, 0],
          [6, 0, 0, 1, 9, 5, 0, 0, 0],
          [0, 9, 8, 0, 0, 0, 0, 6, 0],
          [8, 0, 0, 0, 6, 0, 0, 0, 3],
          [4, 0, 0, 8, 0, 3, 0, 0, 1],
          [7, 0, 0, 0, 2, 0, 0, 0, 6],
          [0, 6, 0, 0, 0, 0, 2, 8, 0],
          [0, 0, 0, 4, 1, 9, 0, 0, 5],
          [0, 0, 0, 0, 8, 0, 0, 7, 9],
        ];
        ctx.font = "51px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        puzzle.forEach((row, r) =>
          row.forEach((value, c) => {
            if (value)
              ctx.fillText(
                String(value),
                startX + (c + 0.5) * cell,
                startY + (r + 0.5) * cell,
              );
          }),
        );
      });
      flatTexture(sudoku, sudokuArt.texture, 1.22, 1.6, 0, 0.011, 0);

      const cat = object("secret", "A small detail");
      cat.position.set(-1.95, 0.04, 2.7);
      cat.rotation.y = 0.18;
      const catTexture = canvasTexture(280, 310, (ctx) => {
        ctx.fillStyle = "#ded18e";
        ctx.beginPath();
        ctx.roundRect(8, 8, 264, 294, 40);
        ctx.fill();
        ctx.fillStyle = "#29352f";
        ctx.beginPath();
        ctx.moveTo(62, 135);
        ctx.lineTo(55, 55);
        ctx.lineTo(115, 94);
        ctx.lineTo(171, 94);
        ctx.lineTo(223, 55);
        ctx.lineTo(216, 145);
        ctx.bezierCurveTo(235, 240, 45, 240, 62, 135);
        ctx.fill();
        ctx.strokeStyle = "#e6d79d";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(90, 153);
        ctx.lineTo(117, 157);
        ctx.moveTo(167, 157);
        ctx.lineTo(194, 153);
        ctx.stroke();
        ctx.fillStyle = "#775a35";
        ctx.font = "italic 33px Georgia";
        ctx.textAlign = "center";
        ctx.fillText("pspsps", 140, 276);
      });
      flatTexture(cat, catTexture.texture, 0.68, 0.75, 0, 0.035, 0);

      // Jointed lamp: the brightest object is a physical shade, not a floating glow.
      const lamp = new T.Group();
      scene.add(lamp);
      lamp.position.set(-5.7, 0, -3.15);
      cylinder(lamp, 0.65, 0.72, 0.16, brass, 0, 0.04, 0);
      rod(
        lamp,
        new T.Vector3(0, 0.1, 0),
        new T.Vector3(0.38, 1.8, -0.2),
        0.065,
        graphiteLight,
      );
      rod(
        lamp,
        new T.Vector3(0.38, 1.8, -0.2),
        new T.Vector3(1.05, 2.4, 0.25),
        0.065,
        graphiteLight,
      );
      const shade = new T.Mesh(
        new T.CylinderGeometry(0.19, 0.65, 0.65, 48, 1, true),
        new T.MeshStandardMaterial({
          color: "#ddd7c7",
          roughness: 0.65,
          metalness: 0.04,
          side: T.DoubleSide,
        }),
      );
      shade.position.set(1.05, 2.2, 0.25);
      shade.castShadow = true;
      lamp.add(shade);
      const shadeRim = new T.Mesh(
        new T.TorusGeometry(0.65, 0.022, 12, 48),
        brass,
      );
      shadeRim.rotation.x = Math.PI / 2;
      shadeRim.position.set(1.05, 1.875, 0.25);
      lamp.add(shadeRim);
      for (const [x, y, z] of [
        [0.38, 1.8, -0.2],
        [1.05, 2.4, 0.25],
      ]) {
        const joint = new T.Mesh(new T.SphereGeometry(0.1, 16, 12), brass);
        joint.position.set(x, y, z);
        lamp.add(joint);
      }
      const bulbMaterial = new T.MeshStandardMaterial({
        color: "#fff0c1",
        emissive: "#ffd999",
        emissiveIntensity: 0.6,
      });
      const bulb = new T.Mesh(new T.SphereGeometry(0.15, 20, 16), bulbMaterial);
      bulb.position.set(1.05, 1.99, 0.25);
      lamp.add(bulb);
      const lampLight = new T.PointLight("#ffdfaa", 5, 13, 2);
      lampLight.position.set(-4.65, 1.85, -2.9);
      scene.add(lampLight);
      const screenLight = new T.PointLight("#d8e3f4", 0, 6, 2);
      screenLight.position.set(0, 1.7, 0.6);
      scene.add(screenLight);

      const hemi = new T.HemisphereLight("#fffdf8", "#777572", 3);
      scene.add(hemi);
      const keyLight = new T.DirectionalLight("#ffffff", 1.7);
      keyLight.position.set(-4, 11, 5);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.left = -10;
      keyLight.shadow.camera.right = 10;
      keyLight.shadow.camera.top = 9;
      keyLight.shadow.camera.bottom = -9;
      keyLight.shadow.normalBias = 0.025;
      keyLight.shadow.bias = -0.00015;
      keyLight.shadow.radius = 5;
      scene.add(keyLight);
      const fillLight = new T.DirectionalLight("#d9e0ed", 0.55);
      fillLight.position.set(6, 5, -5);
      scene.add(fillLight);
      const raycaster = new T.Raycaster();
      const pointer = new T.Vector2();
      const tablePlane = new T.Plane(new T.Vector3(0, 1, 0), -0.08);
      let activeDrag: {
        object: THREE.Object3D;
        point: THREE.Vector3;
        initial: THREE.Vector3;
        startX: number;
        startY: number;
        moved: boolean;
      } | null = null;
      let downAction: string | null = null;
      let hoverId: string | null = null;
      function hit(event: PointerEvent) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.set(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1,
        );
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(
          interactive.filter((item) => item.visible),
          true,
        );
        if (!hits.length) return null;
        let current: THREE.Object3D | null = hits[0].object;
        while (current && !current.userData.action) current = current.parent;
        return current;
      }
      const onMove = (event: PointerEvent) => {
        const item = hit(event);
        if (activeDrag) {
          if (
            Math.hypot(
              event.clientX - activeDrag.startX,
              event.clientY - activeDrag.startY,
            ) > 6
          )
            activeDrag.moved = true;
          if (activeDrag.moved) {
            const p = new T.Vector3();
            raycaster.ray.intersectPlane(tablePlane, p);
            const original =
              originalPositions.get(activeDrag.object) || activeDrag.initial;
            activeDrag.object.position.x = Math.max(
              original.x - 0.9,
              Math.min(
                original.x + 0.9,
                activeDrag.initial.x + p.x - activeDrag.point.x,
              ),
            );
            activeDrag.object.position.z = Math.max(
              original.z - 0.7,
              Math.min(
                original.z + 0.7,
                activeDrag.initial.z + p.z - activeDrag.point.z,
              ),
            );
            activeDrag.object.position.y = 0.16;
            requestRender();
            return;
          }
        }
        const id = item?.userData.action || null;
        if (id !== hoverId) {
          hoverId = id;
          callbacks.current.onHover?.(item?.userData.label || null);
          renderer.domElement.style.cursor = item?.userData.draggable
            ? "grab"
            : item
              ? "pointer"
              : "default";
        }
        if (!isReduced && !mobile && event.pointerType === "mouse") {
          pointerX = pointer.x * 0.2;
          pointerY = pointer.y * 0.12;
          requestRender(35);
        }
      };
      const onDown = (event: PointerEvent) => {
        if (event.button !== 0) return;
        const item = hit(event);
        downAction = item?.userData.action || null;
        if (item?.userData.draggable && event.pointerType === "mouse") {
          const p = new T.Vector3();
          raycaster.ray.intersectPlane(tablePlane, p);
          activeDrag = {
            object: item,
            point: p,
            initial: item.position.clone(),
            startX: event.clientX,
            startY: event.clientY,
            moved: false,
          };
          renderer.domElement.setPointerCapture(event.pointerId);
          renderer.domElement.style.cursor = "grabbing";
        }
      };
      const onUp = (event: PointerEvent) => {
        const item = hit(event);
        const moved = activeDrag?.moved;
        if (activeDrag) {
          activeDrag.object.position.y = 0.035;
          activeDrag = null;
          requestRender();
        }
        if (!moved && downAction && item?.userData.action === downAction) {
          if (downAction === "cube") {
            cubeAngle += Math.PI / 2;
            requestRender(45);
          }
          callbacks.current.onOpen(downAction);
        }
        renderer.domElement.style.cursor = item?.userData.draggable
          ? "grab"
          : item
            ? "pointer"
            : "default";
        downAction = null;
      };
      const onLeave = () => {
        if (!activeDrag) {
          hoverId = null;
          callbacks.current.onHover?.(null);
          pointerX = 0;
          pointerY = 0;
          requestRender(35);
        }
      };
      const onCancel = () => {
        if (activeDrag) activeDrag.object.position.y = 0.035;
        activeDrag = null;
        downAction = null;
        renderer.domElement.style.cursor = "default";
        requestRender();
      };
      renderer.domElement.addEventListener("pointermove", onMove);
      renderer.domElement.addEventListener("pointerdown", onDown);
      renderer.domElement.addEventListener("pointerup", onUp);
      renderer.domElement.addEventListener("pointerleave", onLeave);
      renderer.domElement.addEventListener("pointercancel", onCancel);

      function render() {
        frame = 0;
        if (!alive || document.hidden) return;
        camera.position.x = T.MathUtils.lerp(
          camera.position.x,
          initialCamera.x + pointerX,
          0.1,
        );
        camera.position.z = T.MathUtils.lerp(
          camera.position.z,
          initialCamera.z + pointerY,
          0.1,
        );
        camera.lookAt(target);
        cube.rotation.y = isReduced
          ? cubeAngle + 0.35
          : T.MathUtils.lerp(cube.rotation.y, cubeAngle + 0.35, 0.14);
        renderer.render(scene, camera);
        if (framesToSettle > 0) {
          framesToSettle--;
          frame = requestAnimationFrame(render);
        }
      }
      function requestRender(frames = 1) {
        if (!alive) return;
        framesToSettle = Math.max(framesToSettle, isReduced ? 0 : frames);
        if (!frame && !document.hidden) frame = requestAnimationFrame(render);
      }
      function resize() {
        if (!container) return;
        const width = container.clientWidth,
          height = container.clientHeight;
        if (!width || !height) return;
        const isMobile = width < 700;
        mobile = isMobile;
        const aspect = width / height;
        const frustumWidth = isMobile ? 7.6 : Math.max(13.7, aspect * 9.8);
        camera.left = -frustumWidth / 2;
        camera.right = frustumWidth / 2;
        camera.top = frustumWidth / aspect / 2;
        camera.bottom = -camera.top;
        initialCamera.set(0, isMobile ? 16 : 13.5, isMobile ? 11 : 12);
        target.set(0, 0.5, isMobile ? 0.4 : 0);
        camera.position.copy(initialCamera);
        camera.lookAt(target);
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        laptop.scale.setScalar(isMobile ? 0.92 : 1);
        laptop.position.set(isMobile ? 0.25 : 0, 0.02, isMobile ? 0.35 : 0.3);
        photoWork.scale.setScalar(isMobile ? 0.9 : 1);
        photoWork.position.set(
          isMobile ? -2.6 : -4.05,
          0.035,
          isMobile ? -0.1 : 0.25,
        );
        photoAward.scale.setScalar(isMobile ? 0.9 : 1);
        photoAward.position.set(
          isMobile ? 2.45 : 3.8,
          0.035,
          isMobile ? -3.2 : -1.7,
        );
        notebook.scale.setScalar(isMobile ? 0.85 : 1);
        notebook.position.set(
          isMobile ? 2.45 : 3.85,
          0.08,
          isMobile ? 2.65 : 1.78,
        );
        cube.scale.setScalar(isMobile ? 0.75 : 1);
        cube.position.set(
          isMobile ? -2.65 : -3.9,
          isMobile ? 0.49 : 0.64,
          isMobile ? 2.65 : 2.75,
        );
        satellite.scale.setScalar(isMobile ? 0.5 : 0.72);
        satellite.position.set(
          isMobile ? -2.65 : -3.65,
          0.08,
          isMobile ? -2.85 : -2.9,
        );
        headphones.scale.setScalar(isMobile ? 0.6 : 1);
        headphones.position.set(
          isMobile ? 2.8 : 5.65,
          0.04,
          isMobile ? -0.1 : -1.55,
        );
        tea.scale.setScalar(isMobile ? 0.8 : 1);
        tea.position.set(isMobile ? -1.25 : -5.8, -0.05, isMobile ? 3.6 : 2.2);
        cat.visible = !isMobile;
        guitar.visible = false;
        pencil.visible = !isMobile;
        sudoku.visible = !isMobile;
        lamp.visible = !isMobile;
        lamp.position.set(-6.15, 0, -1.8);
        lamp.scale.setScalar(0.72);
        lampLight.position.set(
          lamp.position.x + 1.05 * lamp.scale.x,
          1.85 * lamp.scale.y,
          lamp.position.z + 0.25 * lamp.scale.z,
        );
        originalPositions.set(photoWork, photoWork.position.clone());
        originalPositions.set(photoAward, photoAward.position.clone());
        requestRender();
      }
      function light(value: boolean) {
        hemi.intensity = value ? 0.85 : 3;
        keyLight.intensity = value ? 0.3 : 1.7;
        fillLight.intensity = value ? 0.3 : 0.55;
        lampLight.intensity = value ? 15 : 2;
        screenLight.intensity = value ? 4 : 0;
        screenMaterial.emissiveIntensity = value ? 0.85 : 0.2;
        bulbMaterial.emissiveIntensity = value ? 2 : 0.3;
        deskMat.color.set(value ? "#777775" : "#ffffff");
        scene.background = new T.Color(value ? "#393b3d" : "#d8d1c5");
        renderer.toneMappingExposure = value ? 1.1 : 1.15;
        requestRender();
      }
      controls.current = {
        light,
        reset: () => {
          for (const [object, position] of originalPositions)
            object.position.copy(position);
          cubeAngle = 0;
          requestRender(35);
        },
        motion: (value) => {
          isReduced = value;
          pointerX = pointerY = 0;
          requestRender();
        },
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
      const visibility = () => {
        if (document.hidden) {
          if (frame) cancelAnimationFrame(frame);
          frame = 0;
        } else requestRender();
      };
      document.addEventListener("visibilitychange", visibility);
      resize();
      light(preferences.current.night);
      cleanup = () => {
        if (frame) cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        document.removeEventListener("visibilitychange", visibility);
        renderer.domElement.removeEventListener("pointermove", onMove);
        renderer.domElement.removeEventListener("pointerdown", onDown);
        renderer.domElement.removeEventListener("pointerup", onUp);
        renderer.domElement.removeEventListener("pointerleave", onLeave);
        renderer.domElement.removeEventListener("pointercancel", onCancel);
        disposeScene();
      };
    }
    createScene().catch(() => {
      if (alive) {
        cleanup();
        setFailed(true);
      }
    });
    return () => {
      alive = false;
      cleanup();
    };
  }, []);

  return (
    <div
      ref={host}
      className="desk-webgl"
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {failed && (
        <div
          className="desk-fallback"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "#c8b99e url('/images/aruzhan-at-work.jpg') center / cover no-repeat",
          }}
        >
          <p
            style={{
              position: "absolute",
              bottom: 20,
              left: 20,
              right: 20,
              padding: 12,
              background: "#f7f0df",
              color: "#2b3028",
              fontSize: 13,
            }}
          >
            The interactive scene is unavailable on this device. My CV and
            projects are available from the navigation.
          </p>
        </div>
      )}
    </div>
  );
}
