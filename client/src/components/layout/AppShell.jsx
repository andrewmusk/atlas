import TreePanel from './TreePanel.jsx';
import ChatPanel from './ChatPanel.jsx';
import NodeEditor from '../editor/NodeEditor.jsx';
import useAtlasStore from '../../store/useAtlasStore.js';
import './AppShell.css';

export default function AppShell() {
  const selectedNodeId = useAtlasStore((s) => s.selectedNodeId);

  return (
    <div className="app-shell">
      <TreePanel />
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
      <ChatPanel nodeId={selectedNodeId} />
    </div>
  );
}
