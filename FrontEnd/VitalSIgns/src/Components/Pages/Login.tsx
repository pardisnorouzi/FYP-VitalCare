import { useState,  useEffect } from 'react';
import axios from 'axios';
import { setSession, getUser} from './Auth';
import './Login.css';
import './Register';
import { useNavigate } from 'react-router-dom'; 
import './DoctorDashboard';
import './AdminDashboard';
import './SensorData';
import { Link } from 'react-router-dom'
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import { API_KEY, AWS_URL } from '../config';




const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string>('');
    const navigate = useNavigate(); 


    useEffect(() => {
      const user = getUser();
      if (user) {
        navigate('/'); 
      }
    }, [navigate]);

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        handleLogin();
      }
    };

    const redirectToRegister = () => {
        navigate('/register');
    };

    const handleLogin = async () => {
        try {
            const response = await axios.post(
                `https://${AWS_URL}.amazonaws.com/prod/login`,
                {
                    username: username,
                    password: password
                },
                {
                    headers: {
                        'x-api-key': API_KEY
                    }
                }
            );
    
          const { user, token } = response.data;
          
    setSession('username', user.username);
    setSession('user', user);
    setSession('token', token);

    if (user.role === 2) {
        navigate('/DoctorDashboard');
    } else if (user.role===1) {
        navigate('/AdminDashboard'); 
    } else {
        navigate(`/SensorData/${user.username}`);
    }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setError(error.response?.data?.message || 'An error occurred during login');
            } else {
                setError('An error occurred during login');
            }
        }
    };

    return (
        <div className="bg-light min-vh-70 d-flex flex-row align-items-center">
        <CContainer>
          <CRow className="justify-content-center">
            <CCol md={8}>
              <CCardGroup>
                <CCard className="p-4">
                  <CCardBody>
                    <CForm>
                      <h1>Login</h1>
                      <p className="text-medium-emphasis">Sign In to your account</p>
                      <CInputGroup className="mb-3">
                        <CInputGroupText>
                          <CIcon icon={cilUser} />
                        </CInputGroupText>
                        <CFormInput placeholder="Username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                      </CInputGroup>
                      <CInputGroup className="mb-4">
                        <CInputGroupText>
                          <CIcon icon={cilLockLocked} />
                        </CInputGroupText>
                        <CFormInput
                          type="password"
                          placeholder="Password"
                          autoComplete="current-password"
			                    value={password} 
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyPress={handleKeyPress}
                        />
                      </CInputGroup>
                      <CRow>
                        <CCol xs={6}>
                          <CButton color="primary" className="px-4" onClick={handleLogin}>
                            Login
                          </CButton>
                        </CCol>
                            {error && <div className="error-message">{error}</div>}
                        <CCol xs={6} className="text-right">
 
                        </CCol>
                      </CRow>
                    </CForm>
                  </CCardBody>
                </CCard>
                <CCard className="text-white bg-primary py-5" style={{ width: '44%' }}>
                  <CCardBody className="text-center">
                    <div>
                      <h2>Sign up</h2>
                      <p>
                        Register Here
                      </p>
                      <Link to="/register">
                        <CButton color="primary" className="mt-3" active tabIndex={-1} onClick={redirectToRegister} >
                          Register Now!
                        </CButton>
                      </Link>
                    </div>
                  </CCardBody>
                </CCard>
              </CCardGroup>
            </CCol>
          </CRow>
        </CContainer>
      </div>
    );
};

export default Login;
