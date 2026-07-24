import { CanvasElement, Point, LineStyle } from '../types/canvas';

export const GRID_SIZE = 20;

export function screenToCanvas(
  screenPoint: Point,
  viewport: { x: number; y: number; zoom: number }
): Point {
  return {
    x: (screenPoint.x - viewport.x) / viewport.zoom,
    y: (screenPoint.y - viewport.y) / viewport.zoom,
  };
}

export function canvasToScreen(
  canvasPoint: Point,
  viewport: { x: number; y: number; zoom: number }
): Point {
  return {
    x: canvasPoint.x * viewport.zoom + viewport.x,
    y: canvasPoint.y * viewport.zoom + viewport.y,
  };
}

export function snapValueToGrid(val: number, gridSize = GRID_SIZE): number {
  return Math.round(val / gridSize) * gridSize;
}

export function getElementCenter(elem: CanvasElement): Point {
  return {
    x: elem.x + elem.width / 2,
    y: elem.y + elem.height / 2,
  };
}

export function getAnchorPoint(
  elem: CanvasElement,
  anchorSide: 'top' | 'right' | 'bottom' | 'left' | 'auto',
  targetElem?: CanvasElement
): Point {
  if (anchorSide === 'top') {
    return { x: elem.x + elem.width / 2, y: elem.y };
  }
  if (anchorSide === 'right') {
    return { x: elem.x + elem.width, y: elem.y + elem.height / 2 };
  }
  if (anchorSide === 'bottom') {
    return { x: elem.x + elem.width / 2, y: elem.y + elem.height };
  }
  if (anchorSide === 'left') {
    return { x: elem.x, y: elem.y + elem.height / 2 };
  }

  // Auto anchor logic (find closest side towards target center)
  if (!targetElem) {
    return getElementCenter(elem);
  }

  const sourceCenter = getElementCenter(elem);
  const targetCenter = getElementCenter(targetElem);

  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) {
      return { x: elem.x + elem.width, y: elem.y + elem.height / 2 }; // Right
    } else {
      return { x: elem.x, y: elem.y + elem.height / 2 }; // Left
    }
  } else {
    if (dy > 0) {
      return { x: elem.x + elem.width / 2, y: elem.y + elem.height }; // Bottom
    } else {
      return { x: elem.x + elem.width / 2, y: elem.y }; // Top
    }
  }
}

export function generateConnectionPath(
  start: Point,
  end: Point,
  lineStyle: LineStyle = 'curved'
): string {
  if (lineStyle === 'straight') {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  if (lineStyle === 'orthogonal') {
    const midX = start.x + (end.x - start.x) / 2;
    return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
  }

  // Curved Bezier path
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const offset = Math.min(Math.max(distance * 0.4, 40), 150);

  // If mostly horizontal or vertical
  let cp1x = start.x;
  let cp1y = start.y;
  let cp2x = end.x;
  let cp2y = end.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    cp1x += dx > 0 ? offset : -offset;
    cp2x -= dx > 0 ? offset : -offset;
  } else {
    cp1y += dy > 0 ? offset : -offset;
    cp2y -= dy > 0 ? offset : -offset;
  }

  return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
}

export function isPointInFrame(point: Point, frameElem: CanvasElement): boolean {
  if (frameElem.type !== 'frame') return false;
  return (
    point.x >= frameElem.x &&
    point.x <= frameElem.x + frameElem.width &&
    point.y >= frameElem.y &&
    point.y <= frameElem.y + frameElem.height
  );
}

export function isElementContainedInFrame(
  elem: CanvasElement,
  frameElem: CanvasElement
): boolean {
  if (elem.id === frameElem.id || frameElem.type !== 'frame') return false;
  const center = getElementCenter(elem);
  return isPointInFrame(center, frameElem);
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export function getBoundingBox(elements: CanvasElement[]): BoundingBox | null {
  if (elements.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach((elem) => {
    minX = Math.min(minX, elem.x);
    minY = Math.min(minY, elem.y);
    maxX = Math.max(maxX, elem.x + elem.width);
    maxY = Math.max(maxY, elem.y + elem.height);
  });

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function getFreehandPathData(points: Point[]): string {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} Z`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }
  return path;
}
