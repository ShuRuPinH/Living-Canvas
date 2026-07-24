export type ElementType =
  | 'text'
  | 'rectangle'
  | 'rounded-rectangle'
  | 'circle'
  | 'ellipse'
  | 'diamond'
  | 'line'
  | 'arrow'
  | 'sticky-note'
  | 'image'
  | 'group'
  | 'frame'
  | 'freehand';

export type KnowledgeObjectType =
  | ''
  | 'Generic'
  | 'Microservice'
  | 'Database'
  | 'Person'
  | 'Project'
  | 'Task'
  | 'Event'
  | 'Document'
  | 'Idea'
  | 'Device'
  | 'Custom';

export type DisplayMode = 'minimal' | 'compact' | 'detailed';

export type ViewMode = 'canvas' | 'list' | 'graph' | 'board';

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface StyleConfig {
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  textColor?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'medium' | 'bold';
  fontFamily?: 'sans' | 'serif' | 'mono';
  textAlign?: 'left' | 'center' | 'right';
  cornerRadius?: number;
  opacity?: number;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  icon?: string;
  stickyColor?: string;
}

export interface PropertyItem {
  id: string;
  key: string;
  value: string;
  type?: 'text' | 'number' | 'status' | 'date' | 'link';
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentItem {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  createdAt: string;
  parentId?: string; // For replies
  resolved?: boolean;
}

export interface AttachmentItem {
  id: string;
  name: string;
  type: 'url' | 'image' | 'file';
  url: string;
  size?: string;
  uploadedAt: string;
}

export interface HistoryItem {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  actor?: string;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex: number;
  frameId?: string; // Parent frame if contained

  // Primary Knowledge Identity
  title: string;
  description?: string;
  objectType?: KnowledgeObjectType;
  icon?: string;
  tags: string[];

  // Visual Customization
  style: StyleConfig;

  // Rich Entity Data
  properties: PropertyItem[];
  notes: NoteItem[];
  comments: CommentItem[];
  attachments: AttachmentItem[];
  history: HistoryItem[];

  // Freehand path points or Image URL
  freehandPoints?: Point[];
  imageUrl?: string;

  // Display mode override for this specific element (optional)
  displayMode?: DisplayMode;
  isCollapsed?: boolean; // For frames or groups
}

export type ConnectionType =
  | 'default'
  | 'HTTP'
  | 'Data Flow'
  | 'Dependency'
  | 'Parent-Child'
  | 'Event'
  | 'gRPC'
  | 'Custom';

export type LineStyle = 'straight' | 'curved' | 'orthogonal';

export interface CanvasConnection {
  id: string;
  sourceId: string;
  targetId: string;
  sourceAnchor?: 'top' | 'right' | 'bottom' | 'left' | 'auto';
  targetAnchor?: 'top' | 'right' | 'bottom' | 'left' | 'auto';

  label?: string;
  connectionType?: ConnectionType;
  description?: string;
  isBiDirectional?: boolean;

  style: {
    strokeColor?: string;
    strokeWidth?: number;
    strokeStyle?: 'solid' | 'dashed' | 'dotted';
    lineCurve?: LineStyle;
    textColor?: string;
  };

  properties: PropertyItem[];
  comments: CommentItem[];
}

export interface CanvasBoardState {
  id: string;
  name: string;
  updatedAt: string;
  elements: Record<string, CanvasElement>;
  connections: Record<string, CanvasConnection>;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  globalDisplayMode: DisplayMode;
  snapToGrid: boolean;
  showGrid: boolean;
}

export type ToolType =
  | 'select'
  | 'pan'
  | 'text'
  | 'rectangle'
  | 'rounded-rectangle'
  | 'circle'
  | 'ellipse'
  | 'diamond'
  | 'sticky-note'
  | 'connection'
  | 'frame'
  | 'image'
  | 'freehand'
  | 'eraser';
