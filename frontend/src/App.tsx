import './App.css'
import {Outlet} from "react-router-dom";

function App() {
  return (
    <div className="flex flex-col grow">
      <Outlet/>
    </div>
  )
}

export default App
