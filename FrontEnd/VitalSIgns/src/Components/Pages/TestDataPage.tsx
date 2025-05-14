import React, { useState } from 'react';
import axios from 'axios';
import { API_KEY, AWS_URL2 } from '../config';

const TestDataPage: React.FC = () => {
  const [deviceId, setDeviceId] = useState('1');
  const [heartRate, setHeartRate] = useState('78');
  const [spo2, setSpo2] = useState('98');
  const [temperature, setTemperature] = useState('37.5');
  const [ecgData, setEcgData] = useState('');
  const [results, setResults] = useState<string[]>([]);

  const generateECG = () => {
    const samples = 100;
    const waveform: number[] = [];
    const cycles = 3;
    const pointsPerCycle = Math.floor(samples / cycles);

    for (let c = 0; c < cycles; c++) {
      for (let i = 0; i < pointsPerCycle; i++) {
        const x = i / pointsPerCycle;
        let val = 300 + Math.random() * 20; 


        if (x > 0.1 && x < 0.2) val += 40 * Math.sin((x - 0.15) * Math.PI * 5);

        if (x > 0.45 && x < 0.55) {
          if (x < 0.48) val -= 150;
          else if (x < 0.5) val += 300;
          else val -= 200;
        }

        if (x > 0.7 && x < 0.85) val += 60 * Math.sin((x - 0.75) * Math.PI * 3);

        waveform.push(Math.floor(val));
      }
    }

    setEcgData(waveform.join(','));
  };

  const handleSubmit = async () => {
    if (!deviceId) return alert('Device ID is required');

    const sessionId = Math.random().toString(36).substr(2, 9).toUpperCase();
    const newResults: string[] = [];

    const send = async (type: string, value: string) => {
      const payload = {
        deviceId,
        sessionId,
        sensorType: type,
        sensorValue: value,
      };

      try {
        const res = await axios.post(`https://${AWS_URL2}.amazonaws.com/prod/ingest`, payload, {
          headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json',
          },
        });
        newResults.push(`${type}: - ${res.data}`);
      } catch (error: any) {
        newResults.push(`${type}: x ${error?.response?.data || 'Error sending data'}`);
      }
    };

    if (heartRate.trim()) await send('HR', heartRate);
    if (spo2.trim()) await send('SPO2', spo2);
    if (temperature.trim()) await send('Temp', temperature);
    if (ecgData.trim()) await send('ECG', ecgData);

    setResults(newResults);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <h2>Admin Test Data Page</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
        <tbody>
          <tr>
            <td><label>Device ID:</label></td>
            <td><input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} /></td>
          </tr>
          <tr>
            <td><label>Heart Rate (bpm):</label></td>
            <td><input value={heartRate} onChange={(e) => setHeartRate(e.target.value)} /></td>
          </tr>
          <tr>
            <td><label>SpO₂ (%):</label></td>
            <td><input value={spo2} onChange={(e) => setSpo2(e.target.value)} /></td>
          </tr>
          <tr>
            <td><label>Temperature (°C):</label></td>
            <td><input value={temperature} onChange={(e) => setTemperature(e.target.value)} /></td>
          </tr>
          <tr>
            <td><label>ECG Data (100 points):</label></td>
            <td>
              <textarea
                value={ecgData}
                onChange={(e) => setEcgData(e.target.value)}
                rows={4}
                cols={50}
              />
              <br />
              <button onClick={generateECG}>Generate ECG</button>
            </td>
          </tr>
        </tbody>
      </table>

      <button onClick={handleSubmit}>Send Data</button>

      {results.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3>Submission Results</h3>
          <ul>
            {results.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TestDataPage;
