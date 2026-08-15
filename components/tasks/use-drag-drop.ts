"use client";

import { useRef, useState } from "react";

const DRAG_THRESHOLD = 5;

function dropIdAt(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y)?.closest("[data-drop-id]");
  return el?.getAttribute("data-drop-id") ?? null;
}

export function useDragDrop({
  onDrop,
}: {
  onDrop: (taskId: string, dropId: string) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const session = useRef<{
    taskId: string;
    pointerId: number;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const suppressedRef = useRef(false);

  function wasDragging() {
    if (suppressedRef.current) {
      suppressedRef.current = false;
      return true;
    }
    return false;
  }

  function bindPointerHandlers(taskId: string) {
    return {
      onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        session.current = {
          taskId,
          pointerId: e.pointerId,
          x: e.clientX,
          y: e.clientY,
          moved: false,
        };
      },
      onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
        const s = session.current;
        if (!s || s.pointerId !== e.pointerId) return;
        const dx = e.clientX - s.x;
        const dy = e.clientY - s.y;
        if (!s.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        if (!s.moved) {
          s.moved = true;
          suppressedRef.current = true;
          setDraggingId(taskId);
        }
        setOverId(dropIdAt(e.clientX, e.clientY));
      },
      onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
        const s = session.current;
        if (!s || s.pointerId !== e.pointerId) return;
        if (s.moved) {
          const target = dropIdAt(e.clientX, e.clientY);
          if (target) onDrop(s.taskId, target);
        }
        session.current = null;
        setDraggingId(null);
        setOverId(null);
      },
      onPointerCancel: () => {
        session.current = null;
        setDraggingId(null);
        setOverId(null);
      },
    };
  }

  return { draggingId, overId, bindPointerHandlers, wasDragging };
}
