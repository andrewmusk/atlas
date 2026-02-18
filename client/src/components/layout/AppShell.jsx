import { useRef, useCallback } from 'react';
import TreePanel from './TreePanel.jsx';
import ChatPanel from './ChatPanel.jsx';
import NodeEditor from '../editor/NodeEditor.jsx';
import useAtlasStore from '../../store/useAtlasStore.js';
import './AppShell.css';

function useResizeHandle(shellRef, side) {
  const dragging = useRef(false);

  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const shell = shellRef.current;
    const rect = shell.getBoundingClientRect();

    const onPointerMove = (e) => {
      if (!dragging.current) return;
      if (side === 'left') {
        const width = Math.min(Math.max(e.clientX - rect.left, 160), 600);
        shell.style.gridTemplateColumns = `${width}px 4px 1fr 4px ${shell._rightWidth || 380}px`;
        shell._leftWidth = width;
      } else {
        const width = Math.min(Math.max(rect.right - e.clientX, 200), 700);
        shell.style.gridTemplateColumns = `${shell._leftWidth || 280}px 4px 1fr 4px ${width}px`;
        shell._rightWidth = width;
      }
    };

    const onPointerUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }, [shellRef, side]);

  return onPointerDown;
}

export default function AppShell() {
  const selectedNodeId = useAtlasStore((s) => s.selectedNodeId);
  const shellRef = useRef(null);
  const onResizeLeft = useResizeHandle(shellRef, 'left');
  const onResizeRight = useResizeHandle(shellRef, 'right');

  return (
    <div className="app-shell" ref={shellRef}>
      <TreePanel />
      <div className="resize-handle" onPointerDown={onResizeLeft} />
      <main className="editor-panel">
        {selectedNodeId ? (
          <NodeEditor nodeId={selectedNodeId} />
        ) : (
          <div className="empty-state">
            <span className="empty-icon">◈</span>
            <span>Select a node to edit</span>
          </div>
        )}
      </main>
      <div className="resize-handle" onPointerDown={onResizeRight} />
      <ChatPanel nodeId={selectedNodeId} />
    </div>
  );
}
