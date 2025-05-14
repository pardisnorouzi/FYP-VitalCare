import { useState, useEffect , useRef} from 'react';
import { useParams } from 'react-router-dom';
import { getSession } from './Auth';
import './DoctorDashboard.css';
import './SensorData.css';
import { API_KEY, AWS_URL2 } from '../config';
import Chart from 'chart.js/auto';
import { Button, Modal, Alert } from 'react-bootstrap';

interface SensorData {
  sessionId: string;
  SPO2: string;
  HR: string;
  Temp: string;
  ECG: string;
  earliestTimestamp?: string;
}

interface ApiResponseItem {
  deviceId: string;
  timeStamp: string;
  sensorType: string;
  sensorValue: string;
  sessionId: string;
}

interface ECGChartProps {
  data: number[];
  backgroundColor?: string;
}

const ECGChart: React.FC<ECGChartProps> = ({ data, backgroundColor }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: Array.from({ length: data.length }, (_, i) => (i * 0.1).toFixed(1)), 
            datasets: [{
              label: '',
              data: data,
              borderColor: backgroundColor || 'black',
              borderWidth: 1,
              pointRadius: 0,
              fill: false 
            }]
          },
          options: {
            plugins: {
              legend: {
                display: false 
              },
              tooltip: {
                enabled: false 
              }
            },
            scales: {
              x: {
                display: true,
                ticks: {
                  color: backgroundColor || 'black', 
                  maxTicksLimit: 22 
                },
                grid: {
                  color: 'rgb(247, 174, 210)', 
                  drawOnChartArea: true,
                  drawTicks: false
                },
                title: {
                  display: true,
                  text: 'Seconds'
                }
              },
              y: {
                display: true, 
                grid: {
                  color: 'rgb(247, 174, 210)', 
                  drawOnChartArea: true,
                  drawTicks: false
                },
                ticks: {
                  color: 'white'
                },
                title: {
                  display: false 
                }
              }
            }
          }
        });
      }
    }
  }, [data,backgroundColor]);

  return <canvas ref={chartRef} />;
};



function SensorDataDisplay() {
  const { requestedUser } = useParams<{ requestedUser: string }>(); 
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [selectedECG, setSelectedECG] = useState<number[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleECGModalClose = () => {
    setShowModal(false);
  };
  
  useEffect(() => {
    const fetchSensorData = async () => {
      try {

        const response = await fetch(`https://${AWS_URL2}.amazonaws.com/prod/retrive`, {
          method: 'POST',
          body: JSON.stringify({
            action: 'sensordata',
            currentuser: getSession('username'),
            user: requestedUser,
          }),
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
          },
        });

        const data = await response.json();

        if (response.ok) {
          const groupedData: { [sessionId: string]: SensorData } = {};

          data.forEach((item: ApiResponseItem) => {
            if (!groupedData[item.sessionId]) {
              groupedData[item.sessionId] = {
                sessionId: item.sessionId,
                SPO2: '',
                HR: '',
                Temp: '',
                ECG:'',
                earliestTimestamp: item.timeStamp, 
              };
            }

            if (item.sensorType === 'SPO2') {
              groupedData[item.sessionId].SPO2 = item.sensorValue;
            } else if (item.sensorType === 'HR') {
              groupedData[item.sessionId].HR = item.sensorValue;
            } else if (item.sensorType === 'Temp') {
              groupedData[item.sessionId].Temp = item.sensorValue;
            } else if (item.sensorType === 'ECG') {
              groupedData[item.sessionId].ECG = item.sensorValue;
            }


            if (item.timeStamp < groupedData[item.sessionId].earliestTimestamp!) {
              groupedData[item.sessionId].earliestTimestamp = item.timeStamp;
            }
          });

          const sensorDataArray = Object.values(groupedData);
          setSensorData(sensorDataArray);
        } else {
          console.error('Failed to retrieve sensor data:', data.message);
          setErrorMessage(data.message);
        }
      } catch (error) {
        console.error('Error retrieving sensor data:', error);
        setErrorMessage('Error retrieving sensor data.');
      }
    };

    fetchSensorData();
  }, [requestedUser]);

  const handleViewECG = (ecgData: number[]) => {
    setSelectedECG(ecgData);
    setShowModal(true);
  };


  function formatTimestamp(timestamp: string, format: string): string {
    const date = new Date(timestamp);

    if (format === 'full') {
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false 
      };
      
      return date.toLocaleString('en-IE', options);
    } else if (format === 'hour') {
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false 
      };
      
      return date.toLocaleString('en-IE', options);
    }
  
    throw new Error(`Invalid timestamp format specified: ${format}`);
  }


  return (
    <div className='table-container'>
      {errorMessage ? ( 
        <Alert variant="danger">{errorMessage}</Alert>
      ) : (
        sensorData.length > 0 && (
          <>
            <h2>Sensor Data</h2>
            <h3>{sensorData[0].earliestTimestamp ? formatTimestamp(sensorData[0].earliestTimestamp, 'full') : ''}</h3>
            <div className="fixed-height">
              <div id="react-root">
                <div className="n1a9i">
                  <div className="kjtKF">
                    <div style={{ display: 'flex', height: '100%' }}>
                      <div id="chart" className="dETRd" style={{ position: 'relative', background: 'radial-gradient(circle, rgb(34, 54, 91) 0%, rgb(23, 36, 61) 100%)' }}>
                        {sensorData[0].ECG && <ECGChart data={sensorData[0].ECG.split(',').map(Number)} backgroundColor="white" />}
                      </div>
                      <div className="ZGRdY">
                        <div className="oyBAJ" style={{ color: '#30BC9A', background: 'radial-gradient(circle, #22365B 0%, #17243d 100%)' }}>
                          <div className="BlI6_">
                            <div className="ts9mF">SPO<span style={{ fontSize: '12px' }}>2</span></div>
                            <div className="fhf58">{sensorData[0].earliestTimestamp ? formatTimestamp(sensorData[0].earliestTimestamp, 'hour') : ''}</div>
                          </div>
                          <div className="iRYHG">
                            <div className="XbaW6">
                              <div>-</div>
                            </div>
                            <div className="n9qbj">{sensorData[0].SPO2}%</div>
                          </div>
                        </div>
                        <div className="oyBAJ" style={{ color: '#50C7E0', background: 'radial-gradient(circle, #22365B 0%, #17243d 100%)' }}>
                          <div className="BlI6_">
                            <div className="ts9mF">HR</div>
                            <div className="fhf58">AUTO<br /></div>
                          </div>
                          <div className="iRYHG">
                            <div className="n9qbj">
                              <div>{sensorData[0].HR} bpm</div>
                            </div>
                          </div>
                        </div>
                        <div className="oyBAJ" style={{ color: '#EC0F6C', background: 'radial-gradient(circle, #22365B 0%, #17243d 100%)' }}>
                          <div className="BlI6_">
                            <div className="ts9mF">Temperature</div>
                            <div className="fhf58">~<br /></div>
                          </div>
                          <div className="iRYHG">
                            <div className="n9qbj">
                              <div>{sensorData[0].Temp} °C</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <h2>History</h2>
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Earliest Timestamp</th>

                  <th>SPO2</th>
                  <th>HR</th>
                  <th>Temp</th>
                  <th>ECG</th>

                </tr>
              </thead>
              <tbody>
                {sensorData.slice(1).map((sensor: SensorData, index: number) => (
                  <tr key={index}>

                    <td>{sensor.earliestTimestamp ? formatTimestamp(sensor.earliestTimestamp, 'full') : ''}</td>
                    <td>{sensor.SPO2}</td>
                    <td>{sensor.HR}</td>
                    <td>{sensor.Temp}</td>

                    <td>
                      {/* Render ECG chart */}
                      {sensor.ECG && (
                        <Button variant="primary" onClick={() => handleViewECG(sensor.ECG.split(',').map(Number))}>
                          View ECG
                        </Button>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )
      )}
      {/* ECG Modal */}
      <Modal show={showModal} onHide={handleECGModalClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>ECG Graph</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ECGChart data={selectedECG} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleECGModalClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}

export default SensorDataDisplay;