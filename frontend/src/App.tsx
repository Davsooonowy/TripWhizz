import './App.css';
import { Outlet } from 'react-router-dom';
import { useDarkMode } from '@/components/util/dark-mode-provider.tsx';
import { TripProvider } from '@/components/util/trip-context';

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
