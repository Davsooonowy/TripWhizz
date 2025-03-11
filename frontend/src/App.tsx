import './App.css';
import { Outlet } from 'react-router-dom';
import { useDarkMode } from '@/components/util/dark-mode-provider.tsx';

function App() {
  const { isDarkMode } = useDarkMode();
  return (
    <div className={`flex flex-col grow ${isDarkMode ? 'dark' : ''}`}>
      <Outlet />
    </div>
  );
}

export default App;
