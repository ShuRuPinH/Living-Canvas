import { CanvasElement, ElementType, Point, LineStyle } from '../types/canvas';

export const GRID_SIZE = 20;

/** Visual types that can safely morph into each other (text ↔ node shapes ↔ sticky). */
export const MORPHABLE_ELEMENT_TYPES: ElementType[] = [
  'text',
  'rectangle',
  'rounded-rectangle',
  'circle',
  'ellipse',
  'diamond',
  'sticky-note',
];

export const MORPHABLE_SHAPE_OPTIONS: {
  type: ElementType;
  label: string;
  icon: string;
}[] = [
  { type: 'text', label: 'Text', icon: 'Type' },
  { type: 'rectangle', label: 'Rectangle', icon: 'Square' },
  { type: 'rounded-rectangle', label: 'Rounded', icon: 'RectangleHorizontal' },
  { type: 'circle', label: 'Circle', icon: 'Circle' },
  { type: 'ellipse', label: 'Ellipse', icon: 'Disc' },
  { type: 'diamond', label: 'Diamond', icon: 'Diamond' },
  { type: 'sticky-note', label: 'Sticky Note', icon: 'StickyNote' },
];

export function isMorphableElementType(type: ElementType): boolean {
  return MORPHABLE_ELEMENT_TYPES.includes(type);
}

export function canMorphElementType(from: ElementType, to: ElementType): boolean {
  return from !== to && isMorphableElementType(from) && isMorphableElementType(to);
}

/**
 * Convert visual shape between text / node shapes / sticky-note.
 * Preserves id, position, knowledge data, and relationships.
 */
export function morphElementType(element: CanvasElement, nextType: ElementType): CanvasElement {
  if (!canMorphElementType(element.type, nextType)) {
    return element;
  }

  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;

  let width = element.width;
  let height = element.height;
  const style = { ...element.style };

  if (nextType === 'text') {
    width = Math.max(width, 120);
    height = Math.min(Math.max(height, 40), 72);
    style.fillColor = style.fillColor ?? 'transparent';
    style.strokeColor = style.strokeColor ?? 'transparent';
    style.strokeWidth = style.strokeWidth ?? 0;
  } else if (nextType === 'sticky-note') {
    width = Math.max(width, 160);
    height = Math.max(height, 140);
    style.stickyColor = style.stickyColor || '#fef08a';
    style.textColor = style.textColor || '#713f12';
    style.fontSize = style.fontSize || 13;
  } else if (nextType === 'circle') {
    const side = Math.max(Math.round((width + height) / 2), 100);
    width = side;
    height = side;
    style.fillColor = style.fillColor && style.fillColor !== 'transparent' ? style.fillColor : '#ffffff';
    style.strokeColor =
      style.strokeColor && style.strokeColor !== 'transparent' ? style.strokeColor : '#64748b';
    style.strokeWidth = style.strokeWidth && style.strokeWidth > 0 ? style.strokeWidth : 2;
  } else {
    // rectangle, rounded-rectangle, ellipse, diamond
    width = Math.max(width, 140);
    height = Math.max(height, 80);
    style.fillColor = style.fillColor && style.fillColor !== 'transparent' ? style.fillColor : '#ffffff';
    style.strokeColor =
      style.strokeColor && style.strokeColor !== 'transparent' ? style.strokeColor : '#64748b';
    style.strokeWidth = style.strokeWidth && style.strokeWidth > 0 ? style.strokeWidth : 2;
    if (nextType === 'rounded-rectangle') {
      style.cornerRadius = style.cornerRadius || 12;
    }
  }

  // Keep element centered when size changes
  const x = centerX - width / 2;
  const y = centerY - height / 2;

  const historyEntry = {
    id: `h-${Date.now()}`,
    action: 'Shape Changed',
    details: `${element.type} → ${nextType}`,
    timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
    actor: 'Current User',
  };

  return {
    ...element,
    type: nextType,
    x,
    y,
    width,
    height,
    style,
    history: [historyEntry, ...(element.history || [])],
  };
}

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
