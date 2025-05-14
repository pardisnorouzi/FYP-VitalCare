import './App.css';
import HeaderComponent from './Components/Header';
import Footer from './Components/Footer';
import NavBar from './Components/NavBar';
import MainContent from './Components/Content';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import About from './Components/Pages/About';
import Login from './Components/Pages/Login';
import Register from './Components/Pages/Register';
import DoctorDashboard from './Components/Pages/DoctorDashboard';
import AdminDashboard from './Components/Pages//AdminDashboard'
import SensorDataDisplay from './Components/Pages/SensorData';
import { useAuthGuard } from './Components/Pages/Auth';
import Chats from './Components/Pages/Chats';
import Chat from './Components/Pages/Chat';
import React, { ReactElement } from 'react';
import Feedback from './Components/Pages/Feedback';
import TestDataPage from './Components/Pages/TestDataPage'; 



function App() {


  return (
    <>
      <Router>
          <NavBar></NavBar>
          <HeaderComponent></HeaderComponent>
          <Routes>
            <Route path="/" element={<MainContent/>}/>
            <Route path="/Login" element={<Login/>}/>
            <Route path="/Register" element={<Register/>}/>
            <Route path="/about" element={<About />}/>
            <Route path="/DoctorDashboard" element={<DoctorDashboardGuarded />} />
            <Route path="/AdminDashboard" element={<AdminDashboardGuarded />} />
            <Route path="/SensorData/:requestedUser" element={<SensorGuarded />} />
            <Route
              path="/Chats"
              element={<LoggedinGuarded element={<Chats />} />}
            />
            <Route
              path="/Chat/:chatid"
              element={<LoggedinGuarded element={<Chat />} />}
            />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/TestData" element={<AdminOnlyGuarded element={<TestDataPage />} />} />
          </Routes>
          <Footer></Footer>
        </Router>
    </>
  );
}


const DoctorDashboardGuarded = () => {
  useAuthGuard([2]); 
  return <DoctorDashboard />;
};

const AdminDashboardGuarded = () => {
  useAuthGuard([1]); 
  return <AdminDashboard />;
};

const AdminOnlyGuarded: React.FC<GuardedRouteProps> = ({ element }) => {
  useAuthGuard([1]); 
  return element;
};

const SensorGuarded = () => {
  useAuthGuard([1, 2, 3]); 
  return <SensorDataDisplay />;
};

interface GuardedRouteProps {
  element: ReactElement;
}

const LoggedinGuarded: React.FC<GuardedRouteProps> = ({ element }) => {
  useAuthGuard([1, 2, 3]);
  return element;
};


export default App;
