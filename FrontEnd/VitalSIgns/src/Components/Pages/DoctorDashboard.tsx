import { useState, useEffect } from 'react';
import { getSession } from './Auth';
import './DoctorDashboard.css';
import './SensorData';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_KEY2, AWS_URL2 } from '../config';

interface Patient {
  id: number;
  username: string;
  name: string;
  email: string;
  doctor: string;
  city: string;
  birth: string;
}
function DoctorDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const doctorUsername = getSession('username');
        if (!doctorUsername) {
          console.error('Doctor username not found in session storage');
          return;
        }

        const response = await axios.post(
          `https://${AWS_URL2}.amazonaws.com/prod/retrive`,
          {
            action: 'userlist',
            currentuser: doctorUsername,
            user: doctorUsername,
          },
          {
            headers: {
              'x-api-key': API_KEY2
            }
          }
        );

        if (response.status === 200) {
          const data = response.data;
          setPatients(data as Patient[]);
        } else {
          console.error('Failed to retrieve patients:', response.data.message);
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

  return (
    <div className="table-container responsive-table">
      <h1>List of the Patients</h1>
      <input
        type="text"
        placeholder="Search for patients"
        value={searchTerm}
        onChange={handleSearchChange}
        className="search-input"
      />
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="table-responsive">
      <table className="table table-striped table-bordered">
        <thead>
          <tr>
            <th>Number</th>
            <th>Patient</th>
            <th>Email</th>
            <th>County</th>
            <th>Birth</th>
          </tr>
        </thead>
        <tbody>
          {searchResults.map((patient: Patient, index: number) => (
            <tr key={index + 1}>
              <td data-label="Number">{index + 1}</td>
              <td data-label="Patient">
                <Link to={`/SensorData/${patient.username}`}>{patient.name}</Link>
              </td>
              <td data-label="Email">{patient.email}</td>
              <td data-label="County">{patient.city}</td>
              <td data-label="Birth">{patient.birth}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
}

export default DoctorDashboard;
