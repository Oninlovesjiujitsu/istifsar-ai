'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  BaseEdge,
  getStraightPath,
  type Node,
  type Edge,
  type EdgeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { cn } from '@/src/lib/utils';
import type { ContentionClaim, ContentionMeta } from '@/src/types/contention';

type Props = {
  contentions: ContentionMeta[];
  layout?: 'vertical' | 'horizontal';
  interactive?: boolean;
  isMobile?: boolean;
};

const SCHOLAR_PALETTE = [
  { hex: '#d4af37', dash: '8 4' },
  { hex: '#f2ca50', dash: '4 4' },
  { hex: '#b8963f', dash: '12 4 4 4' },
  { hex: '#e9c349', dash: '6 8' },
  { hex: '#c9a84c', dash: '10 3' },
] as const;

/* ── Custom Center Node ──────────────────────────────────────────────── */

function CustomCenterNode({ data }: { data: { label: string } }) {
  return (
    <div className="flex flex-col items-center justify-center pointer-events-auto">
      <Handle type="source" position={Position.Top} className="opacity-0" id="center-source" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} />
      <Handle type="target" position={Position.Top} className="opacity-0" id="center-target" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} />

      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-primary flex items-center justify-center border-4 border-card shadow-md">
        <svg
          className="w-7 h-7 sm:w-9 sm:h-9 text-primary-foreground"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
        </svg>
      </div>

      <div className="mt-2 bg-card px-4 py-1.5 border border-border rounded-sm text-center max-w-[200px] shadow-lg">
        <h3 className="font-serif text-[11px] sm:text-xs font-bold text-primary leading-tight">
          {data.label}
        </h3>
        <span className="text-[8px] uppercase tracking-tighter text-muted-foreground block mt-0.5">
          Contested Topic
        </span>
      </div>
    </div>
  );
}

/* ── Custom Scholar Node with Hover & Pin Support ─────────────────────── */

function CustomScholarNode({
  data,
}: {
  data: {
    claim: ContentionClaim;
    color: string;
    isActive: boolean;
    onToggle: () => void;
  };
}) {
  const { claim, isActive, onToggle } = data;
  const [isHovered, setIsHovered] = useState(false);
  const showTooltip = isActive || isHovered;

  return (
    <div
      className="flex flex-col items-center pointer-events-auto select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle type="source" position={Position.Top} className="opacity-0" id="scholar-source" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} />
      <Handle type="target" position={Position.Top} className="opacity-0" id="scholar-target" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} />

      <div
        className="group relative flex flex-col items-center cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <div
          className={cn(
            "w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary border-4 border-card flex items-center justify-center transition-all shadow-md",
            showTooltip ? "scale-115 border-primary shadow-xl" : "hover:scale-110"
          )}
        >
          <svg
            className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" />
          </svg>
        </div>

        <span className={cn(
          "mt-2 font-serif text-[10px] sm:text-[11px] text-center max-w-[110px] truncate transition-colors",
          showTooltip ? "text-primary font-bold" : "text-foreground"
        )}>
          {claim.scholarName}
        </span>

        {/* Custom Tooltip overlay (Shows on mouse hover OR click pin) */}
        <div
          className={cn(
            'absolute w-[240px] sm:w-[280px] p-4 bg-card border border-border rounded-md shadow-2xl transition-all duration-200 pointer-events-auto',
            'bottom-[calc(100%+0.75rem)] left-1/2 -translate-x-1/2 origin-bottom',
            showTooltip
              ? 'opacity-100 scale-100 translate-y-0 z-[100] pointer-events-auto'
              : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-2">
            <h4 className="font-sans font-semibold text-[13px] sm:text-sm text-primary leading-snug">
              {claim.argumentHeadline}
            </h4>
            <p className="font-serif italic text-[11px] sm:text-xs text-muted-foreground leading-relaxed pl-2 border-l border-primary/30">
              &ldquo;{claim.claim}&rdquo;
            </p>
          </div>
          <span className="absolute w-2.5 h-2.5 bg-card border-r border-b border-border rotate-45 left-1/2 -translate-x-1/2 top-full -mt-1" />
        </div>
      </div>
    </div>
  );
}

/* ── Custom Edge Components ──────────────────────────────────────────── */

function CenterEdge({ id, sourceX, sourceY, targetX, targetY, style }: EdgeProps) {
  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  return (
    <BaseEdge
      id={id}
      path={edgePath}
      className="center-edge-path"
      style={style}
    />
  );
}

function ContentionEdge({ id, sourceX, sourceY, targetX, targetY, style }: EdgeProps) {
  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  return (
    <BaseEdge
      id={id}
      path={edgePath}
      className="contention-edge-path"
      style={style}
    />
  );
}

/* ── Unified Contention Graph Canvas ─────────────────────────────────── */

export default function ContentionGraph({ contentions, layout = 'vertical', interactive = true, isMobile = false }: Props) {
  if (!contentions || contentions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px]">
        <p className="text-muted-foreground text-sm">
          No contentions detected. All claims are in consensus.
        </p>
      </div>
    );
  }

  const [activeTooltipIds, setActiveTooltipIds] = useState<string[]>([]);

  const nodeTypes = useMemo(() => ({
    centerNode: CustomCenterNode,
    scholarNode: CustomScholarNode,
  }), []);

  const edgeTypes = useMemo(() => ({
    centerEdge: CenterEdge,
    contentionEdge: ContentionEdge,
  }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Dynamically calculate height to stack contentions inside a single canvas
  const canvasHeight = useMemo(() => {
    if (layout === 'horizontal') return 700;
    return Math.max(isMobile ? 500 : 600, contentions.length * (isMobile ? 450 : 600));
  }, [contentions, layout, isMobile]);

  useEffect(() => {
    const baseNodes: Node[] = [];
    const baseEdges: Edge[] = [];

    // Layout configuration
    const radius = isMobile ? 140 : 220; // Tighter radius on mobile

    contentions.forEach((contention, k) => {
      const { claims, contentionId } = contention;
      const topicLabel = contention.topic ?? contention.title;
      const isLegacy = claims.length === 0;

      // Position center node for this contention cluster
      let centerX = 0;
      let centerY = 0;

      if (layout === 'horizontal') {
        centerX = k * (isMobile ? 500 : 700) + (isMobile ? 250 : 350);
        centerY = isMobile ? 250 : 350;
      } else {
        centerX = isMobile ? 200 : 300;
        centerY = k * (isMobile ? 450 : 600) + (isMobile ? 250 : 300);
      }

      // Center Node (Topic)
      baseNodes.push({
        id: `center-${contentionId}`,
        type: 'centerNode',
        position: { x: centerX - 100, y: centerY - 60 },
        data: { label: topicLabel },
        draggable: true,
      });

      if (!isLegacy) {
        const N = claims.length;
        claims.forEach((claim, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / N;
          const x = centerX + radius * Math.cos(angle) - 60;
          const y = centerY + radius * Math.sin(angle) - 50;
          const uniqueScholarId = `${contentionId}-${claim.documentId}`;

          baseNodes.push({
            id: uniqueScholarId,
            type: 'scholarNode',
            position: { x, y },
            data: {
              claim,
              color: SCHOLAR_PALETTE[i % SCHOLAR_PALETTE.length].hex,
              isActive: false,
              onToggle: () => {
                setActiveTooltipIds((prev) =>
                  prev.includes(claim.documentId)
                    ? prev.filter((id) => id !== claim.documentId)
                    : [...prev, claim.documentId]
                );
              },
            },
            draggable: true,
          });

          // Edge connecting scholar node to center node
          baseEdges.push({
            id: `edge-center-${uniqueScholarId}`,
            source: `center-${contentionId}`,
            sourceHandle: 'center-source',
            target: uniqueScholarId,
            targetHandle: 'scholar-target',
            type: 'centerEdge',
            style: {
              stroke: SCHOLAR_PALETTE[i % SCHOLAR_PALETTE.length].hex,
              strokeWidth: 2,
              strokeDasharray: SCHOLAR_PALETTE[i % SCHOLAR_PALETTE.length].dash,
            },
          });
        });

        // Contention edges between conflicting scholars
        for (let i = 0; i < N; i++) {
          for (let j = i + 1; j < N; j++) {
            baseEdges.push({
              id: `edge-contention-${contentionId}-${claims[i].documentId}-${claims[j].documentId}`,
              source: `${contentionId}-${claims[i].documentId}`,
              sourceHandle: 'scholar-source',
              target: `${contentionId}-${claims[j].documentId}`,
              targetHandle: 'scholar-target',
              type: 'contentionEdge',
              style: {
                stroke: '#ef4444',
                strokeWidth: 1.5,
                strokeDasharray: '5 5',
              },
            });
          }
        }
      }
    });

    setNodes(baseNodes);
    setEdges(baseEdges);
  }, [contentions, layout, isMobile, setNodes, setEdges]);

  // Update tooltip active state on existing nodes without resetting their position
  useEffect(() => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.type === 'scholarNode') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = node.data as any;
          if (data?.claim) {
            return {
              ...node,
              data: {
                ...data,
                isActive: activeTooltipIds.includes(data.claim.documentId),
              },
            };
          }
        }
        return node;
      })
    );
  }, [activeTooltipIds, setNodes]);

  const onPaneClick = useCallback(() => {
    setActiveTooltipIds([]);
  }, []);

  return (
    <article
      className="relative flex flex-col bg-background p-4 sm:p-6 lg:p-0 lg:flex-1 lg:min-h-0"
      onClick={onPaneClick}
    >
      <div
        className="w-full rounded-lg border border-border overflow-hidden bg-card h-[var(--canvas-height)] lg:flex-1 lg:min-h-0 lg:rounded-none lg:border-0"
        style={{ '--canvas-height': `${canvasHeight}px` } as React.CSSProperties}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.15, maxZoom: 1.0 }}
          minZoom={0.65}
          maxZoom={1.5}
          zoomOnScroll={interactive}
          panOnScroll={interactive}
          panOnDrag={interactive}
          zoomOnPinch={true}
          zoomOnDoubleClick={interactive}
          nodesDraggable={interactive}
          nodesConnectable={false}
          elementsSelectable={interactive}
          onPaneClick={onPaneClick}
        >
          <Background color="hsl(var(--primary) / 0.04)" gap={16} size={1} />
        </ReactFlow>
      </div>
    </article>
  );
}
