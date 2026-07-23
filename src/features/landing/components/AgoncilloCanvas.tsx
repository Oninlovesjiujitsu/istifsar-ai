'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MAX_LINES = 120;
const NODE_COUNT = 40;

interface AgoncilloCanvasProps {
  activeTab: 'none' | 'constraint' | 'contention' | 'citation';
}

function ScholarlyNetwork({ activeTab }: AgoncilloCanvasProps) {
  const nodesGroupRef = useRef<THREE.Group>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const packetsGroupRef = useRef<THREE.Group>(null);
  const dustRef = useRef<THREE.Points>(null);
  const mainGroupRef = useRef<THREE.Group>(null);

  // 1. Initialize Node Base Data (Spherical layout by default)
  const baseSphericalPos = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      const theta = Math.acos(2 * (i / (NODE_COUNT - 1)) - 1);
      const phi = Math.sqrt(NODE_COUNT * Math.PI) * theta;
      const r = 2.8 + Math.sin(i * 3) * 0.2; // slight radial variation for organic look
      positions.push(
        new THREE.Vector3(
          r * Math.sin(theta) * Math.cos(phi),
          r * Math.sin(theta) * Math.sin(phi),
          r * Math.cos(theta)
        )
      );
    }
    return positions;
  }, []);

  // Node runtime state (lerped towards targets in useFrame)
  const nodesData = useMemo(() => {
    const data = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      data.push({
        id: i,
        currentPos: baseSphericalPos[i].clone(),
        targetPos: baseSphericalPos[i].clone(),
        currentColor: new THREE.Color('#8f7d6e'),
        targetColor: new THREE.Color('#8f7d6e'),
        currentScale: 0.08,
        targetScale: 0.08,
      });
    }
    return data;
  }, [baseSphericalPos]);

  // Line runtime state
  const lineData = useMemo(() => {
    const data = [];
    for (let i = 0; i < MAX_LINES; i++) {
      data.push({
        currentStart: new THREE.Vector3(),
        currentEnd: new THREE.Vector3(),
        targetStartNode: 0,
        targetEndNode: 0,
      });
    }
    return data;
  }, []);

  // Citation tree structural indices
  const parentIndices = useMemo(() => {
    const parents = new Array(NODE_COUNT).fill(0);
    // Layer 0: indices 0, 1, 2
    // Layer 1: indices 3..10 (connect to layer 0)
    for (let i = 3; i <= 10; i++) {
      parents[i] = (i - 3) % 3;
    }
    // Layer 2: indices 11..24 (connect to layer 1)
    for (let i = 11; i <= 24; i++) {
      parents[i] = 3 + ((i - 11) % 8);
    }
    // Layer 3: indices 25..39 (connect to layer 2)
    for (let i = 25; i <= 39; i++) {
      parents[i] = 11 + ((i - 25) % 14);
    }
    return parents;
  }, []);

  // Node indices divided by layers for rendering
  const { nodeLayers, nodesByLayer } = useMemo(() => {
    const layers = new Array(NODE_COUNT).fill(0);
    const byLayer: { [key: number]: number[] } = { 0: [], 1: [], 2: [], 3: [] };

    for (let i = 0; i < NODE_COUNT; i++) {
      let layer = 0;
      if (i >= 3 && i <= 10) layer = 1;
      else if (i >= 11 && i <= 24) layer = 2;
      else if (i >= 25) layer = 3;

      layers[i] = layer;
      byLayer[layer].push(i);
    }
    return { nodeLayers: layers, nodesByLayer: byLayer };
  }, []);

  // 2. Pre-calculated topologies for the states
  const defaultConnections = useMemo(() => {
    const pairs: { from: number; to: number }[] = [];
    // Connect each node to its 2 nearest neighbors
    for (let i = 0; i < NODE_COUNT; i++) {
      const posI = baseSphericalPos[i];
      const distances: { index: number; dist: number }[] = [];
      for (let j = i + 1; j < NODE_COUNT; j++) {
        distances.push({ index: j, dist: posI.distanceTo(baseSphericalPos[j]) });
      }
      distances.sort((a, b) => a.dist - b.dist);
      for (let k = 0; k < Math.min(2, distances.length); k++) {
        pairs.push({ from: i, to: distances[k].index });
      }
    }
    return pairs;
  }, [baseSphericalPos]);

  const constraintConnections = useMemo(() => {
    const pairs = [];
    for (let i = 1; i < NODE_COUNT; i++) {
      pairs.push({ from: i, to: 0 }); // Anchor everything to central source (node 0)
    }
    return pairs;
  }, []);

  const contentionConnections = useMemo(() => {
    const pairs = [];
    // Cluster A (left) ring + internal diagonals
    for (let i = 0; i < 20; i++) {
      pairs.push({ from: i, to: (i + 1) % 20 });
      pairs.push({ from: i, to: (i + 4) % 20 });
    }
    // Cluster B (right) ring + internal diagonals
    for (let i = 20; i < 40; i++) {
      const next = 20 + ((i - 20 + 1) % 20);
      const diag = 20 + ((i - 20 + 4) % 20);
      pairs.push({ from: i, to: next });
      pairs.push({ from: i, to: diag });
    }
    // Clash bridge lines
    pairs.push({ from: 4, to: 24 });
    pairs.push({ from: 10, to: 30 });
    pairs.push({ from: 16, to: 36 });
    return pairs;
  }, []);

  const citationConnections = useMemo(() => {
    const pairs = [];
    for (let i = 3; i < NODE_COUNT; i++) {
      pairs.push({ from: i, to: parentIndices[i] });
    }
    return pairs;
  }, [parentIndices]);

  const getConnectionsForState = (state: string) => {
    if (state === 'constraint') return constraintConnections;
    if (state === 'contention') return contentionConnections;
    if (state === 'citation') return citationConnections;
    return defaultConnections;
  };

  // Get target position and color values for nodes based on state
  const getTargets = (state: string) => {
    const targets = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      let x = 0, y = 0, z = 0;
      let r = 0.56, g = 0.49, b = 0.43; // neutral grey-brown
      let scale = 0.08;

      if (state === 'none') {
        const base = baseSphericalPos[i];
        x = base.x;
        y = base.y;
        z = base.z;
        r = 0.56; g = 0.49; b = 0.43; // neutral taupe (#8f7d6e)
        scale = 0.08 + Math.sin(i) * 0.015;
      } else if (state === 'constraint') {
        if (i === 0) {
          x = 0; y = 0; z = 0;
          r = 0.76; g = 0.55; b = 0.22; // Gold core (#c28d38)
          scale = 0.38;
        } else {
          // Distributed on small sphere around core
          const theta = Math.acos(2 * (i / (NODE_COUNT - 1)) - 1);
          const phi = Math.sqrt(NODE_COUNT * Math.PI) * theta;
          const rRadius = 1.7;
          x = rRadius * Math.sin(theta) * Math.cos(phi);
          y = rRadius * Math.sin(theta) * Math.sin(phi);
          z = rRadius * Math.cos(theta);
          r = 0.30; g = 0.23; b = 0.20; // Slate/Ink rust (#4c3a30)
          scale = 0.06;
        }
      } else if (state === 'contention') {
        const cluster = i < 20 ? 0 : 1;
        const localIdx = i < 20 ? i : i - 20;
        const cx = cluster === 0 ? -2.2 : 2.2;

        const theta = Math.acos(2 * (localIdx / 19) - 1);
        const phi = Math.sqrt(20 * Math.PI) * theta;
        const rRadius = 0.9;
        x = cx + rRadius * Math.sin(theta) * Math.cos(phi);
        y = rRadius * Math.sin(theta) * Math.sin(phi);
        z = rRadius * Math.cos(theta);

        if (cluster === 0) {
          r = 0.36; g = 0.44; b = 0.31; // Sage Green (#5b7050)
        } else {
          r = 0.69; g = 0.25; b = 0.24; // Terracotta Red (#b0413e)
        }
        scale = 0.07 + Math.sin(i) * 0.015;
      } else if (state === 'citation') {
        const layer = nodeLayers[i];
        const layerNodes = nodesByLayer[layer];
        const localIdx = layerNodes.indexOf(i);
        const numInLayer = layerNodes.length;

        y = -2.0 + layer * 1.35;

        if (numInLayer === 1) {
          x = 0; z = 0;
        } else {
          const angle = (localIdx / numInLayer) * Math.PI * 2 + layer * 0.15;
          const radius = layer === 0 ? 0.7 : layer === 1 ? 1.5 : layer === 2 ? 2.1 : 2.5;
          x = radius * Math.cos(angle);
          z = radius * Math.sin(angle);
        }

        r = 0.83; g = 0.69; b = 0.22; // Amber gold (#d4af37)
        scale = layer === 0 ? 0.15 : 0.08;
      }

      targets.push({ x, y, z, r, g, b, scale });
    }
    return targets;
  };

  // Citation packet flow structure
  const packetsData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 12; i++) {
      data.push({
        fromNode: 0,
        toNode: 0,
        progress: Math.random(),
        speed: 0.008 + Math.random() * 0.012,
        currentPos: new THREE.Vector3(),
      });
    }
    return data;
  }, []);

  const resetPacket = (packet: typeof packetsData[0]) => {
    const conn = citationConnections[Math.floor(Math.random() * citationConnections.length)];
    if (conn) {
      // Flow from parent (conn.to) to child (conn.from)
      packet.fromNode = conn.to;
      packet.toNode = conn.from;
      packet.progress = 0;
      packet.speed = 0.01 + Math.random() * 0.015;
    }
  };

  // 3. React Effect to set target states on tab change
  useEffect(() => {
    const targets = getTargets(activeTab);
    for (let i = 0; i < NODE_COUNT; i++) {
      nodesData[i].targetPos.set(targets[i].x, targets[i].y, targets[i].z);
      nodesData[i].targetColor.setRGB(targets[i].r, targets[i].g, targets[i].b);
      nodesData[i].targetScale = targets[i].scale;
    }

    const activeConnections = getConnectionsForState(activeTab);
    for (let i = 0; i < MAX_LINES; i++) {
      if (i < activeConnections.length) {
        lineData[i].targetStartNode = activeConnections[i].from;
        lineData[i].targetEndNode = activeConnections[i].to;
      } else {
        // Collapsed to zero-length lines when unused
        lineData[i].targetStartNode = 0;
        lineData[i].targetEndNode = 0;
      }
    }

    // Initialize packets for citation flow
    if (activeTab === 'citation') {
      packetsData.forEach((p) => resetPacket(p));
    }
  }, [activeTab, nodesData, lineData, baseSphericalPos]);

  // Pre-allocate buffer position array for lines
  const linePositions = useMemo(() => {
    return new Float32Array(MAX_LINES * 6);
  }, []);

  // Background floating dust positions
  const dustPositions = useMemo(() => {
    const pos = new Float32Array(50 * 3);
    for (let i = 0; i < 50; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return pos;
  }, []);

  // 4. Main Animation Frame Loop
  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Subtle parallax rotation responding to pointer/mouse
    if (mainGroupRef.current) {
      const targetRotationY = time * 0.05 + state.pointer.x * 0.25;
      const targetRotationX = state.pointer.y * 0.2;
      mainGroupRef.current.rotation.y = THREE.MathUtils.lerp(mainGroupRef.current.rotation.y, targetRotationY, 0.05);
      mainGroupRef.current.rotation.x = THREE.MathUtils.lerp(mainGroupRef.current.rotation.x, targetRotationX, 0.05);
    }

    // Slowly rotate background dust
    if (dustRef.current) {
      dustRef.current.rotation.y = time * 0.015;
      dustRef.current.rotation.z = time * 0.008;
    }

    // Morph nodes positions, scales, and colors
    if (nodesGroupRef.current) {
      for (let i = 0; i < NODE_COUNT; i++) {
        const mesh = nodesGroupRef.current.children[i] as THREE.Mesh;
        if (mesh) {
          const node = nodesData[i];

          // Compute contention oscillation offsets
          let contentionOffset = 0;
          if (activeTab === 'contention') {
            const cluster = i < 20 ? 0 : 1;
            contentionOffset = Math.sin(time * 2.5 + i * 0.1) * 0.08;
            mesh.position.set(
              node.targetPos.x,
              node.targetPos.y + (cluster === 0 ? contentionOffset : -contentionOffset),
              node.targetPos.z
            );
            node.currentPos.copy(mesh.position);
          } else {
            // Standard smooth lerp
            node.currentPos.lerp(node.targetPos, 0.08);
            mesh.position.copy(node.currentPos);
          }

          // Lerp material color
          node.currentColor.lerp(node.targetColor, 0.08);
          const material = mesh.material as THREE.MeshBasicMaterial;
          if (material) {
            material.color.copy(node.currentColor);
          }

          // Lerp scale
          node.currentScale = THREE.MathUtils.lerp(node.currentScale, node.targetScale, 0.08);
          mesh.scale.setScalar(node.currentScale);
        }
      }
    }

    // Morph lines positions
    if (lineRef.current) {
      const positions = lineRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < MAX_LINES; i++) {
        const line = lineData[i];
        const targetStart = nodesData[line.targetStartNode].currentPos;
        const targetEnd = nodesData[line.targetEndNode].currentPos;

        line.currentStart.lerp(targetStart, 0.08);
        line.currentEnd.lerp(targetEnd, 0.08);

        const idx = i * 6;
        positions[idx] = line.currentStart.x;
        positions[idx + 1] = line.currentStart.y;
        positions[idx + 2] = line.currentStart.z;
        positions[idx + 3] = line.currentEnd.x;
        positions[idx + 4] = line.currentEnd.y;
        positions[idx + 5] = line.currentEnd.z;
      }
      lineRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Move citation packets along active paths
    if (packetsGroupRef.current) {
      if (activeTab === 'citation') {
        for (let i = 0; i < 12; i++) {
          const mesh = packetsGroupRef.current.children[i] as THREE.Mesh;
          if (mesh) {
            const packet = packetsData[i];
            packet.progress += packet.speed;

            if (packet.progress >= 1) {
              resetPacket(packet);
            }

            packet.currentPos.lerpVectors(
              nodesData[packet.fromNode].currentPos,
              nodesData[packet.toNode].currentPos,
              packet.progress
            );
            mesh.position.copy(packet.currentPos);
            mesh.scale.setScalar(1);
          }
        }
      } else {
        // Hide packets in other states
        for (let i = 0; i < 12; i++) {
          const mesh = packetsGroupRef.current.children[i] as THREE.Mesh;
          if (mesh) {
            mesh.scale.setScalar(0);
          }
        }
      }
    }
  });

  return (
    <group>
      {/* Background drifting stars/dust */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[dustPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#d4c5b9"
          size={0.03}
          sizeAttenuation={true}
          transparent={true}
          opacity={0.4}
        />
      </points>

      {/* Main network model */}
      <group ref={mainGroupRef}>
        {/* Rubber-band connection lines */}
        <lineSegments ref={lineRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[linePositions, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#9f8e78"
            transparent={true}
            opacity={0.25}
          />
        </lineSegments>

        {/* Nodes */}
        <group ref={nodesGroupRef}>
          {nodesData.map((node) => (
            <mesh key={node.id}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshBasicMaterial color={node.currentColor} />
            </mesh>
          ))}
        </group>

        {/* Citation flow particles */}
        <group ref={packetsGroupRef}>
          {packetsData.map((_, i) => (
            <mesh key={i} scale={0}>
              <sphereGeometry args={[0.045, 8, 8]} />
              <meshBasicMaterial color="#c28d38" />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

export default function AgoncilloCanvas({ activeTab }: AgoncilloCanvasProps) {
  return (
    <div className="w-full h-full min-h-[320px] lg:min-h-[480px] relative rounded-md select-none overflow-hidden cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ position: [0, 0, 8.2], fov: 48 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[2, 5, 2]} intensity={1} />
        <ScholarlyNetwork activeTab={activeTab} />
      </Canvas>

      {/* Interactive Hover Overlay Card when activeTab === 'contention' */}
      {activeTab === 'contention' && (
        <div className="absolute bottom-3 left-3 right-3 p-3.5 rounded-lg bg-card/95 border border-amber-500/40 shadow-xl backdrop-blur-md text-xs font-mono animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-auto">
          <div className="flex items-center justify-between gap-2 mb-1.5 text-amber-600 font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Node of Contention Active</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 font-mono">
              Debate Map
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed font-sans">
            <strong className="text-foreground font-semibold">Agoncillo (1956)</strong> vs{' '}
            <strong className="text-foreground font-semibold">Alvarez (1927)</strong>: Disputed Tejeros election votes. Hover over scholars in <a href="/explore" className="text-primary underline font-semibold">The Contention Map</a> to inspect claims.
          </p>
        </div>
      )}

      {activeTab === 'constraint' && (
        <div className="absolute bottom-3 left-3 right-3 p-3.5 rounded-lg bg-card/95 border border-primary/40 shadow-xl backdrop-blur-md text-xs font-mono animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-auto">
          <div className="flex items-center justify-between gap-2 mb-1 text-primary font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Agoncillo Constraint Gate</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
              Zero Hallucination
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed font-sans">
            Answers are strictly rejected if similarity &lt; 0.65. &quot;No document, no history.&quot;
          </p>
        </div>
      )}

      {activeTab === 'citation' && (
        <div className="absolute bottom-3 left-3 right-3 p-3.5 rounded-lg bg-card/95 border border-emerald-500/40 shadow-xl backdrop-blur-md text-xs font-mono animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-auto">
          <div className="flex items-center justify-between gap-2 mb-1 text-emerald-600 font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Citation Economy Tree</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              Anchored Sources
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed font-sans">
            Every synthesized claim maps to a page-level manuscript split-pane preview.
          </p>
        </div>
      )}
    </div>
  );
}
