import { useState, useEffect } from 'react';
import { getSession } from './Auth';
import './DoctorDashboard.css';
import { useNavigate, Link } from 'react-router-dom';
import { API_KEY, API_KEY2, AWS_URL ,AWS_URL2 } from '../config';
import { Button, Form, Table, Toast } from 'react-bootstrap';
import { BiUser, BiPlusMedical, BiUserCircle } from 'react-icons/bi';



interface Patient {
  id: number;
  username: string;
  name: string;
  email: string;
  doctor: string;
  city: string;
  birth: string;
  role: number;
  doctorname: string;
  deviceId: string;
}

function Admin() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const [message, setMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false); 
  const [editPatient, setEditPatient] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const adminUsername = getSession('username');
        if (!adminUsername) {
          console.error('Admin username not found in session storage');
          return;
        }

        const response = await fetch(`https://${AWS_URL2}.amazonaws.com/prod/retrive`, {
          method: 'POST',
          body: JSON.stringify({
            action: 'userlist',
            currentuser: adminUsername,
            user: adminUsername,
          }),
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
          },
        });

        const data = await response.json();

        if (response.ok) {
          setPatients(data as Patient[]);
        } else {
          console.error('Failed to retrieve patients:', data.message);
        }
      } catch (error) {
        console.error('Error retrieving patients:', error);
      }
    };

    fetchPatients();
  }, []);

  useEffect(() => {
    const filteredPatients = patients.filter((patient: Patient) =>
    Object.values(patient).some((field) => {
      if (typeof field === 'string') {
        return field.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    })
  );
  

    setSearchResults(filteredPatients);

    if (filteredPatients.length === 0 && searchTerm !== '') {
      setError('No users found');
    } else {
      setError('');
    }
  }, [patients, searchTerm]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleAddUser = () => {
    navigate('/Register');
  };


  const handleDeleteUser = async (username: string) => {
    try {
      const response = await fetch(`https://${AWS_URL}.amazonaws.com/prod/user`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'deleteuser',
          username: username,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY2,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('User deleted successfully');
        setShowToast(true);
        setPatients(patients.filter(patient => patient.username !== username));
        setTimeout(() => {
          setMessage('');
          setShowToast(false);
        }, 10000);
      } else {
        setMessage(`Error: ${data.message}`);
        setShowToast(true);
      }
    } catch (error) {
      setMessage(`Error: ${error}`);
      setShowToast(true);
    }
  };

  const renderRoleIcon = (role: number) => {
    switch (role) {
      case 1:
        return <BiUser />;
      case 2:
        return <BiPlusMedical />;
      case 3:
        return <BiUserCircle />;
      default:
        return null;
    }
  };

  const handleEditPatient = (username: string) => {
    setEditPatient(username); 
  };

  const handleEditChange = (username: string, field: string, value: string) => {

    setPatients((prevPatients) => {
      return prevPatients.map((patient) => {
        if (patient.username === username) {
          return { ...patient, [field]: value };
        }
        return patient;
      });
    });
  };

  const handleSaveEdit = () => {
    setEditPatient(null); 
  };

  const handleCancelEdit = () => {
    setEditPatient(null); 
  };

  return (
    <div className="table-container">
      <h1>List of the Users</h1>
      <div className="button-container">
        <button onClick={handleAddUser}>Add User</button>
      </div>
      <input
        type="text"
        placeholder="Search for patients"
        value={searchTerm}
        onChange={handleSearchChange}
        className="search-input"
      />
      {error && <div className="alert alert-danger">{error}</div>}

      <Toast
        style={{
          position: 'fixed',
          bottom: 100,
          right: 20,
        }}
        bg={message.includes('Error') ? 'danger' : 'success'}
        show={showToast}
        onClose={() => setShowToast(false)}
        delay={10000}
        autohide
      >
        <Toast.Header>
          <strong className="mr-auto">Message</strong>
        </Toast.Header>
        <Toast.Body>{message}</Toast.Body>
      </Toast>
        <br /><br />
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Number</th>
            <th>Username</th>
            <th>Patient</th>
            <th>Email</th>
            <th>Doctor</th>
            <th>County</th>
            <th>Birth</th>
            <th>Role</th>
            <th>Device</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {searchResults.map((patient, index) => (
            <tr key={index + 1}>
              <td>{index + 1}</td>
              <td>
                <Link to={`/SensorData/${patient.username}`}>
                  {patient.username}
                </Link></td>
              <td>  
              {editPatient === patient.username ? (
                  <Form.Control
                    type="text"
                    value={patient.name}
                    onChange={(e) => handleEditChange(patient.username, 'name', e.target.value)}
                  />
                ) : (
                  patient.name
                )}
              </td>
              <td>                
                {editPatient === patient.username ? (
                  <Form.Control
                    type="email"
                    value={patient.email}
                    onChange={(e) => handleEditChange(patient.username, 'email', e.target.value)}
                  />
                ) : (
                  patient.email
                )}
              </td>
              <td>{patient.doctorname}</td>
              <td>{patient.city}</td>
              <td>{patient.birth}</td>
              <td>
                {renderRoleIcon(patient.role)}{' '}
                {patient.role === 1 && 'Administrator'}
                {patient.role === 2 && 'Doctor'}
                {patient.role === 3 && 'Patient'}
              </td>
              <td>{patient.deviceId}</td>
              <td>
              {editPatient === patient.username ? (
                  <>
                    <Button onClick={handleSaveEdit} variant="success">
                      Save
                    </Button>{' '}
                    <Button onClick={handleCancelEdit} variant="danger">
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => handleEditPatient(patient.username)} variant="info">
                    Edit
                  </Button>
                )}
                {' '}
                <Button onClick={() => handleDeleteUser(patient.username)} variant="danger">
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default Admin;
