import './NavBar.css';
import { Link, useNavigate } from 'react-router-dom';
import { getUser, logOut } from './Pages/Auth';
import { useState, useRef, useEffect } from 'react';
import { API_KEY, AWS_URL2 } from './config';

function NavBar() {
  const user = getUser();
  const navigate = useNavigate();

  const [showAlerts, setShowAlerts] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const alertRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (alertRef.current && !alertRef.current.contains(event.target as Node)) {
      setShowAlerts(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user?.username) return;

    try {
      const response = await fetch(`https://${AWS_URL2}.amazonaws.com/prod/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify({
          action: 'getunread',
          username: user.username
        })
      });

      const data = await response.json();
      if (response.ok) {
        setUnreadCount(data.unreadCount || 0);
        setUnreadNotifications(data.unreadNotifications || 0);
        setNotifications(data.notifications || []);
      } else {
        console.error("Failed to fetch unread count:", data.message);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      year: '2-digit',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleString('en-IE', options);
  };
  

  useEffect(() => {
    fetchUnreadCount(); 
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 5000); 

    return () => clearInterval(interval); 
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logOut();
    navigate('/');
  };

  return (
    <div className="container-fluid position-relative p-0">
      <nav className="navbar navbar-expand-lg navbar-dark px-5 py-3 py-lg-0">
        <Link to="/" className="navbar-brand p-0">
          <h1 className="m-0"><i className="fa fa-user-tie me-2"></i>Vital Care</h1>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
          <span className="fa fa-bars"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarCollapse">
          <ul className="navbar-nav ms-auto py-0">
            <li className="nav-item"><Link to="/" className="nav-link">Home</Link></li>
            {user ? (
              <>
                {user.role === 1 && <li className="nav-item"><Link to="/AdminDashboard" className="nav-link">Admin Dashboard</Link></li>}
                {user.role === 2 && <li className="nav-item"><Link to="/DoctorDashboard" className="nav-link">Doctor Dashboard</Link></li>}
                {user.role === 3 && <li className="nav-item"><Link to={`/SensorData/${user.username}`} className="nav-link">Sensor Data</Link></li>}
                <li className="nav-item"><Link to="/Chats" className="nav-link">Chats</Link></li>
                <li className="nav-item"><Link to="/Feedback" className="nav-link">Feedback</Link></li>
                {user.role === 1 && <li className="nav-item"><Link to="/TestData" className="nav-link">Test Data</Link></li>}
                <li className="nav-item"><Link to="/" className="nav-link" onClick={handleLogout}>Logout</Link></li>

                {/* Icon area */}
                <li className="nav-item d-flex align-items-center">
                  {/* Message Icon */}
                  <div className="icon-wrapper me-3" title="Messages">
                    <Link to="/Chats" className="nav-link position-relative">
                      <i className="fa fa-comment fa-lg"></i>
                      {unreadCount > 0 && (
                        <span className="superscript-badge">{unreadCount}</span>
                      )}
                    </Link>
                  </div>

                  {/* Alert Icon */}
                  <div className="icon-wrapper position-relative" ref={alertRef}>
                    <div
                      className="nav-link position-relative"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setShowAlerts(!showAlerts)}
                      title="Alerts"
                    >
                      <i className="fa fa-bell fa-lg" />
                      {unreadNotifications > 0 && (
                        <span className="superscript-badge">{unreadNotifications}</span>
                      )}
                    </div>

                    {showAlerts && (
                      <div className="alert-tooltip">
                        {notifications.length === 0 ? (
                          <div className="alert-item">No new alerts</div>
                        ) : (
                          notifications.map((alert, index) => (
                            <Link
                              key={index}
                              to={`/SensorData/${alert.fromuser}?alert=${encodeURIComponent(alert.sensorType)}`}
                              className="alert-item"
                              onClick={() => setShowAlerts(false)}
                            >
                              <div className="alert-text">
                                <i className="fa fa-exclamation-circle me-2 text-danger" />
                                {alert.notiftext}
                              </div>
                              <div className="alert-timestamp">
                                {formatDateTime(alert.timeStamp)}
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item"><Link to="/login" className="nav-link">Login</Link></li>
                <li className="nav-item"><Link to="/register" className="nav-link">Register</Link></li>
                <li className="nav-item"><Link to="/Feedback" className="nav-link">Feedback</Link></li>
              </>
            )}
          </ul>
        </div>
      </nav>
    </div>
  );
}

export default NavBar;
