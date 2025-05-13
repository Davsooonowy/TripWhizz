import { useDarkMode } from '@/components/util/dark-mode-provider.tsx';
import { TripProvider } from '@/components/util/trip-context';

import { Outlet } from 'react-router-dom';

import './App.css';

function App() {
  const { isDarkMode } = useDarkMode();
  return (
    <TripProvider>
      <div className={`flex flex-col grow ${isDarkMode ? 'dark' : ''}`}>
        <Outlet />
      </div>
    </TripProvider>
  );
}

export default App;
