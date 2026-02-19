import { Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/node/:nodeId" element={<AppShell />} />
      <Route path="*" element={<AppShell />} />
    </Routes>
  );
}
