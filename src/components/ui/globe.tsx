"use client";
import * as THREE from 'three';
import { useEffect, useRef, useState } from "react";
import { Color, Scene, Fog, PerspectiveCamera, Vector3 } from "three";
import ThreeGlobe from "three-globe";
import { useThree, Canvas, extend } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import countries from "../../data/globe.json";  // 从 ui 目录跳转到上级目录 data 文件夹
declare module "@react-three/fiber" {
  interface ThreeElements {
    threeGlobe: ThreeElements["mesh"] & {
      new (): ThreeGlobe;
    };
  }
}

extend({ ThreeGlobe: ThreeGlobe });

const RING_PROPAGATION_SPEED = 3;
const aspect = 1.2;
//const cameraZ = 300;

type Position = {
  order: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  arcAlt: number;
  color: string;
};

export type GlobeConfig = {
  pointSize?: number;
  globeColor?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  emissive?: string;
  emissiveIntensity?: number;
  shininess?: number;
  polygonColor?: string;
  ambientLight?: string;
  directionalLeftLight?: string;
  directionalTopLight?: string;
  pointLight?: string;
  arcTime?: number;
  arcLength?: number;
  rings?: number;
  maxRings?: number;
  initialPosition?: {
    lat: number;
    lng: number;
  };
  autoRotate?: boolean;
  autoRotateSpeed?: number;
};

interface WorldProps {
  globeConfig: GlobeConfig;
  data: Position[];
}

//let numbersOfRings = [0];

export function Globe({ globeConfig, data }: WorldProps) {
  const globeRef = useRef<ThreeGlobe | null>(null);
  const groupRef = useRef(null);  // 或者提供初始值，如 {} 或其他适当的初值

  const [isInitialized, setIsInitialized] = useState(false);
  
  const defaultProps = {
    pointSize: 2,
    atmosphereColor: "#FFFFFF",
    showAtmosphere: true,
    atmosphereAltitude: 1,
    polygonColor: "rgb(200, 200, 200)",
    globeColor: "#000000",
    emissive: "#ffffff",
    emissiveIntensity: 10,
    shininess: 0,
    arcTime: 1000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    ambientLight: "#ffffff",
    directionalLeftLight: "#ffffff", // 左侧光照
    directionalTopLight: "#ffffff",  // 顶部光照
    pointLight: "#ffffff", // 点光源
    scale: 2,
    initialPosition: { lat: 22.3193, lng: 114.1694 },
    autoRotate: true,
    autoRotateSpeed: 0.5,
    ...globeConfig,
  };
  
  useEffect(() => {
    if (!globeRef.current && groupRef.current) {
      globeRef.current = new ThreeGlobe();
      (groupRef.current as any).add(globeRef.current);
      setIsInitialized(true);
    }
  }, []);

  // Build material when globe is initialized or when relevant props change
  
  useEffect(() => {
    if (!globeRef.current || !isInitialized) return;
  
    const globeMaterial = globeRef.current.globeMaterial() as unknown as {
      color: Color;
      emissive: Color;
      emissiveIntensity: number;
      shininess: number;
    };
    
    // 设置地球的材质颜色
    globeMaterial.color = new Color(globeConfig.globeColor);
    
    // 设置发光颜色和强度
    globeMaterial.emissive = new Color(0x262626); // 白色发光
    globeMaterial.emissiveIntensity = 1; // 设置发光强度
    
    // 设置地球表面的光泽度
    globeMaterial.shininess = 1;
  
    // 这里可以添加代码来为地球添加外发光层
    // 创建一个发光的半透明球体
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0xffffff) }, // 发光颜色
        viewVector: { value: new THREE.Vector3(0, 0, 0) }
      },
      vertexShader: `
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        void main() {
          gl_FragColor = vec4(glowColor.rgb, 1); // 半透明效果
        }
      `,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  
    // 创建外发光球体
    const glowSphere = new THREE.SphereGeometry(1.1, 64, 64); // 球体比地球稍大
    const glowMesh = new THREE.Mesh(glowSphere, glowMaterial);
    globeRef.current.add(glowMesh);
  }, [isInitialized, globeConfig.globeColor]);
  
  

  // Build data when globe is initialized or when data changes
  useEffect(() => {
    if (!globeRef.current || !isInitialized || !data) return;

    const arcs = data;
    let points = [];
    for (let i = 0; i < arcs.length; i++) {
      const arc = arcs[i];
      //const rgb = hexToRgb(arc.color) as { r: number; g: number; b: number };
      points.push({
        size: defaultProps.pointSize,
        order: arc.order,
        color: arc.color,
        lat: arc.startLat,
        lng: arc.startLng,
      });
      points.push({
        size: defaultProps.pointSize,
        order: arc.order,
        color: arc.color,
        lat: arc.endLat,
        lng: arc.endLng,
      });
    }

    // remove duplicates for same lat and lng
    const filteredPoints = points.filter(
      (v, i, a) =>
        a.findIndex((v2) =>
          ["lat", "lng"].every(
            (k) => v2[k as "lat" | "lng"] === v[k as "lat" | "lng"],
          ),
        ) === i,
    );

    globeRef.current
      .hexPolygonsData(countries.features)
      .hexPolygonResolution(4)
      .hexPolygonMargin(0.0)
      .showAtmosphere(defaultProps.showAtmosphere)
      .atmosphereColor(defaultProps.atmosphereColor)
      .atmosphereAltitude(defaultProps.atmosphereAltitude)
      .hexPolygonColor(() => defaultProps.polygonColor);

    globeRef.current
      .arcsData(data)
      .arcStartLat((d) => (d as { startLat: number }).startLat * 1)
      .arcStartLng((d) => (d as { startLng: number }).startLng * 1)
      .arcEndLat((d) => (d as { endLat: number }).endLat * 1)
      .arcEndLng((d) => (d as { endLng: number }).endLng * 1)
      .arcColor((e: any) => (e as { color: string }).color)
      .arcAltitude((e) => (e as { arcAlt: number }).arcAlt * 1)
      .arcStroke(() => [0.32, 0.28, 0.3][Math.round(Math.random() * 2)])
      .arcDashLength(defaultProps.arcLength)
      .arcDashInitialGap((e) => (e as { order: number }).order * 1)
      .arcDashGap(15)
      .arcDashAnimateTime(() => defaultProps.arcTime);

    globeRef.current
      .pointsData(filteredPoints)
      .pointColor((e) => (e as { color: string }).color)
      .pointsMerge(true)
      .pointAltitude(0.0)
      .pointRadius(1);

    globeRef.current
      .ringsData([])
      .ringColor(() => defaultProps.polygonColor)
      .ringMaxRadius(defaultProps.maxRings)
      .ringPropagationSpeed(RING_PROPAGATION_SPEED)
      .ringRepeatPeriod(
        (defaultProps.arcTime * defaultProps.arcLength) / defaultProps.rings,
      );
  }, [
    isInitialized,
    data,
    defaultProps.pointSize,
    defaultProps.showAtmosphere,
    defaultProps.atmosphereColor,
    defaultProps.atmosphereAltitude,
    defaultProps.polygonColor,
    defaultProps.arcLength,
    defaultProps.arcTime,
    defaultProps.rings,
    defaultProps.maxRings,
  ]);

  // Handle rings animation with cleanup
  useEffect(() => {
    if (!globeRef.current || !isInitialized || !data) return;

    const interval = setInterval(() => {
      if (!globeRef.current) return;

      const newNumbersOfRings = genRandomNumbers(
        0,
        data.length,
        Math.floor((data.length * 4) / 5),
      );

      const ringsData = data
        .filter((_, i) => newNumbersOfRings.includes(i))  // 删除 d 参数
        .map((d) => ({
          lat: d.startLat,
          lng: d.startLng,
          color: d.color,
        }));

      globeRef.current.ringsData(ringsData);
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [isInitialized, data]);

  return <group ref={groupRef} />;
}

export function WebGLRendererConfig() {
  const { gl, size } = useThree();

  useEffect(() => {
    gl.setPixelRatio(window.devicePixelRatio);
    gl.setSize(size.width, size.height);
    gl.setClearColor(0xffaaff, 0);
  }, []);

  return null;
}

export function World(props: WorldProps) {
  const { globeConfig } = props;
  const scene = new Scene();
  scene.fog = new Fog(0xffffff, 400, 2000);
  return (
    <Canvas
      scene={scene}
      camera={new PerspectiveCamera(75, aspect, 1, 3000)} // 将近剪切平面设置为 1 并增大远剪切平面
    >
      <WebGLRendererConfig />
      <ambientLight color={globeConfig.ambientLight} intensity={0.7} />
      <directionalLight
        color={globeConfig.directionalLeftLight}
        position={new Vector3(-400, 100, 400)}
      />
      <directionalLight
        color={globeConfig.directionalTopLight}
        position={new Vector3(200, 500, 200)}
      />
      <pointLight
        color={globeConfig.pointLight}
        position={new Vector3(200, 500, 200)}
        intensity={1}
      />
      <Globe {...props} />
      // 通过 OrbitControls 来调整地球显示大小
    <OrbitControls
      enablePan={false}
      enableZoom={false}
      minDistance={200} // 相机的最小距离，调整为更小的值
      maxDistance={600} // 相机的最大距离，调整为更大值
      autoRotateSpeed={4}
      autoRotate={true}
      minPolarAngle={Math.PI / 3.5}
      maxPolarAngle={Math.PI - Math.PI / 3}
    />

    </Canvas>

  );
}

export function hexToRgb(hex: string) {
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (_, r, g, b) {  // 删除 m 参数
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function genRandomNumbers(min: number, max: number, count: number) {
  const arr = [];
  while (arr.length < count) {
    const r = Math.floor(Math.random() * (max - min)) + min;
    if (arr.indexOf(r) === -1) arr.push(r);
  }

  return arr;
}

