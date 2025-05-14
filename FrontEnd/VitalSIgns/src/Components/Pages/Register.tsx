import { useState, ChangeEvent, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getUser} from './Auth';
import './Register.css';
import { API_KEY2, AWS_URL ,AWS_URL2 } from '../config';
import { Modal, Button } from 'react-bootstrap';

const Register = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [doctorName, setDoctorName] = useState('');
    const [error, setError] = useState('');
    const [dob, setDob] = useState<null | string>(null);
    const handleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        setDob(value);
    };
    const [image, setImage] = useState<File | null>(null);
    const [imageKey, setImageKey] = useState<string>('');
    const [imageUrl, setImageUrl] = useState<string>('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const citiesInIreland = ['Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway', 'Kerry',
                            'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick', 'Longford', 'Louth', 'Mayo','Meath',
                            'Monaghan','Offaly', 'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath', 'Wexford',' Wicklow'];
    const [doctorList, setDoctorList] = useState<any[]>([]);
    const [userRole, setUserRole] = useState('3');
    const [showSuccessModal, setShowSuccessModal] = useState(false);




    const handleClose = () => {
        setShowSuccessModal(false);


        const user = getUser();
        if (user && user.role === 1) {
            navigate('/AdminDashboard');
        } else {
            navigate('/Login');
        }
    };

    useEffect(() => {
        const fetchDoctorList = async () => {
            try {
                const response = await axios.post(
                    `https://${AWS_URL2}.amazonaws.com/prod/retrive`,
                    {
                        action: 'doctorlist'
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': API_KEY2
                        }
                    }
                );


                setDoctorList(response.data);
            } catch (error) {
                console.error('Error fetching doctor list:', error);
            }
        };

        fetchDoctorList(); 
    }, []);

    const validateForm = () => {
        let errorMessage = '';

        if (!username) {
            errorMessage += 'Username is required. ';
        } else if (!password) {
            errorMessage += 'Password is required. ';
        } else if (!name) {
            errorMessage += 'Name is required. ';
        } else if (!email) {
            errorMessage += 'Email is required. ';
        } else if (!validateEmail(email)) {
            errorMessage += 'Email is not valid. ';
        } else if(userRole === '3' && !doctorName) {
            errorMessage += 'Doctor\'s Name is required. ';
        } else if (!city) {
            errorMessage += 'City is required. ';
        } else if (!address) {
            errorMessage += 'Address is required. ';
        } else if (!dob) {
            errorMessage += 'Date of Birth is required. ';
        } else if(!image || !imageKey){
            errorMessage += 'You upload an image.';   
        }  else if (!termsAccepted) {
            errorMessage += 'You must accept the terms and conditions. ';
        }

        if (errorMessage) {
            setError(errorMessage);
            return false;
        }

        setError('');
        return true;
    };

    const validateEmail = (email: string) => {
        const re = /\S+@\S+\.\S+/;
        return re.test(email);
    };



    useEffect(() => {
        const user = getUser();
        if (user && (user.role === 2 || user.role === 3)) {
          navigate('/');
        }
      }, [navigate]);

    const handleRegister = async () => {

        if (!validateForm()) {
            return;
        }

        try {
            const response = await axios.post(
                `https://${AWS_URL}.amazonaws.com/prod/register`,
                {
                    name: name,
                    email: email,
                    username: username,
                    password: password,
                    address: address,
                    birth: dob,
                    city: city,
                    doctorName: doctorName,
                    role: userRole,
                    imagekey: imageKey
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': API_KEY2
                    }
                }
            );


            console.log(response.data);

            setShowSuccessModal(true);

        } catch (error) {
            if (axios.isAxiosError(error)) {
                setError(error.response?.data?.message || 'An error occurred during registration');
            } else {
                setError('An error occurred during registration');
            }
        }
    };


    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const selectedImage = event.target.files[0];
            setImage(selectedImage);
            setImageUrl(URL.createObjectURL(selectedImage)); 
        }
    };

    useEffect(() => {
        if (image) {
            const formData = new FormData();
            formData.append('image', image);

            axios.post(
                `https://${AWS_URL}.amazonaws.com/prod/image`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'x-api-key': API_KEY2
                    }
                }
            ).then(response => {
                console.log('Image uploaded successfully:', response.data);
                setImageKey(response.data.key);
            }).catch(error => {

                console.error('Error uploading image:', error);
            });
        }
    }, [image]);

    

    const downloadImage = (image: File) => {
        const url = URL.createObjectURL(image);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', image.name);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

return (
    <div className="container">
        <div className="row">
            <div className="col-md-6 offset-md-3">.
                <div className="register-container">
                    <h2 className='centered'>Registeration</h2>


                    <div className="form-group">
                        <label>I am a</label><br/>
                        <div className="form-check form-check-inline">
                            <input 
                                className="form-check-input" 
                                type="radio" 
                                name="userRole" 
                                id="patient" 
                                value="3" 
                                checked={userRole === '3'} 
                                onChange={() => setUserRole('3')} 
                            />
                            <label className="form-check-label" htmlFor="patient">Patient</label>
                        </div>
                        <div className="form-check form-check-inline">
                            <input 
                                className="form-check-input" 
                                type="radio" 
                                name="userRole" 
                                id="doctor" 
                                value="2" 
                                checked={userRole === '2'} 
                                onChange={() => setUserRole('2')} 
                            />
                            <label className="form-check-label" htmlFor="doctor">Doctor</label>
                        </div>
                    </div>


                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <div className="row">
                            <div className="col">
                                <div className="input-group">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text"><i className="bi bi-person"></i></span>
                                    </div>
                                    <input type="text" className="form-control" id="username" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                    <label htmlFor="username">Password</label>
                    <div className="row">
                        <div className="col">
                            <div className="input-group">
                                <div className="input-group-prepend">
                                    <span className="input-group-text"><i className="bi bi-lock"></i></span>
                                </div>
                                    <input type="password" className="form-control" id="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                    <label htmlFor="username">Name</label>
                    <div className="row">
                        <div className="col">
                            <div className="input-group">
                                <div className="input-group-prepend">
                                    <span className="input-group-text"><i className="bi bi-person-vcard"></i></span>
                                </div>
                        <input type="text" className="form-control" id="name" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                            </div>
                        </div>
                    </div>
        
                    <div className="form-group">
                    <label htmlFor="username">Email</label>
                    <div className="row">
                        <div className="col">
                            <div className="input-group">
                                <div className="input-group-prepend">
                                    <span className="input-group-text"><i className="bi bi-envelope-at"></i></span>
                                </div>
                        <input type="email" className="form-control" id="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                            </div>
                        </div>
                    </div>

                    {userRole === '3' && (
                        <div className="form-group">
                        <label htmlFor="username">Doctor's Name</label>
                        <div className="row">
                            <div className="col">
                                <div className="input-group">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text"><i className="bi bi-prescription2"></i></span>
                                    </div>
                            <select className="form-control" id="doctorName" value={doctorName} onChange={(e) => setDoctorName(e.target.value)}>
                                <option value="">Select Doctor</option>
                                {doctorList.map((doctor) => (
                                    <option key={doctor.username} value={doctor.username}>{doctor.name}</option>
                                ))}
                            </select>
                            </div>
                            </div>
                        </div>
                    </div>
                    )}

                        <div className="form-group">
                        <label htmlFor="username">Date of Birth</label>
                        <div className="row">
                            <div className="col">
                                <div className="input-group">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text"><i className="bi bi-calendar-date"></i></span>
                                    </div>
                        <input
                            className="form-control"
                            id="dob"
                            value={dob || ''}
                            onChange={handleDateChange}
                            type="date"
                            placeholder="Select Date of Birth"
                        />
                            </div>
                            </div>
                        </div>
                    </div>

                        <div className="form-group">
                        <label htmlFor="username">County</label>
                        <div className="row">
                            <div className="col">
                                <div className="input-group">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text"><i className="bi bi-globe"></i></span>
                                    </div>
                        <select className="form-control" id="city" value={city} onChange={(e) => setCity(e.target.value)}>
                            <option value="">Select county</option>
                            {citiesInIreland.map((city) => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                        </div>
                            </div>
                        </div>
                    </div>

                        <div className="form-group">
                        <label htmlFor="username">Address</label>
                        <div className="row">
                            <div className="col">
                                <div className="input-group">
                                    <div className="input-group-prepend">
                                        <span className="input-group-text"><i className="bi bi-house-add"></i></span>
                                    </div>
                        <input type="text" className="form-control" id="address" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
                        </div>
                            </div>
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="formFile" className="form-label">Upload Image</label>
                        <input className="form-control" type="file" accept="image/*" onChange={handleImageChange} />
                        {imageKey && (
                            <div>
                            <img
                                src={imageUrl}
                                alt="Selected"
                                style={{ maxWidth: '200px', marginTop: '10px', cursor: 'pointer' }}
                                onClick={() => image && downloadImage(image)}
                            />
                            </div>
                        )}
                    </div>
                    <div className="form-group form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id="terms"
                            checked={termsAccepted}
                            onChange={() => setTermsAccepted(!termsAccepted)}
                        />
                        <label className="form-check-label" htmlFor="terms">I accept the terms and conditions</label>
                    </div>
                    {error && <div className="alert alert-danger" role="alert">{error}</div>}

                    <button className="btn btn-primary" onClick={handleRegister}>Register</button>
                </div>
            </div>
        </div>

        <Modal show={showSuccessModal} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title><i className="bi bi-check-circle-fill text-success mr-2"></i>Registration Successful</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-success">Your registration was successful!</Modal.Body>
                <Modal.Footer>
                    <Button variant="success" onClick={handleClose}>
                        OK
                    </Button>
                </Modal.Footer>
        </Modal>


    </div>





);
};

export default Register;
