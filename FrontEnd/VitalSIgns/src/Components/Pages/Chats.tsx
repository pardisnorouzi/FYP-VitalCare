import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { getSession, getUser } from './Auth';
import { API_KEY, API_KEY2, AWS_URL2 } from '../config';
import { Button, Form, Modal, Table } from 'react-bootstrap';

interface Chats {
  id: number;
  fromuser: string;
  touser: string;
  sessionId: string;
  datecreated: string;
}

interface Targets {
  username: string;
  name?: string;
}

const ChatsDash = () => {
  const [chatSessions, setChatSessions] = useState<Chats[]>([]);
  const [error, setError] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [userOptions, setUserOptions] = useState<Targets[]>([]);

  useEffect(() => {
    const fetchChatSessions = async () => {
      try {
        const usern = getSession('username');
        if (!usern) {
          console.error('username not found in session storage');
          return;
        }

        const response = await axios.post(
          `https://${AWS_URL2}.amazonaws.com/prod/chats`,
          {
            action: 'getchats',
            username: usern,
          },
          {
            headers: {
              'x-api-key': API_KEY2
            }
          }
        );
        const data = response.data; 
        if (response.status === 200) {
          if (data.chatSessions && Array.isArray(data.chatSessions)) {
            setChatSessions(data.chatSessions);
          } else {
            setError('Response data is not in the expected format');
          }
        } else {
          setError(`Error: ${data.message}`);
          console.error('Failed to retrieve chats:', data.message);
        }
      } catch (error) {
        console.error('Error retrieving chats:', error);
      }
    };

    fetchChatSessions();
  }, []);

  useEffect(() => {
    const fetchUserOptions = async () => {
      try {
        const user = getUser();
        const currentuser = getSession('username');
        console.log(user.role);
        const role = user.role; 

        if (!role) {
          console.error('Role not found in session storage');
          return;
        }

      const response = await fetch(`https://${AWS_URL2}.amazonaws.com/prod/retrive`, {
        method: 'POST',
        body: JSON.stringify({
          action: (role === 1 || role === 2) ? 'userlist' : 'mydoctor',
          currentuser: currentuser,
          user: currentuser,
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
      });

      const data = await response.json();
      if (response.ok) {
        let updatedUserOptions = [...data];
        if (role === 2 || role === 3) {
          updatedUserOptions = [...updatedUserOptions, { username: 'pardis', name: 'Administrator' }];
        }
        setUserOptions(updatedUserOptions as Targets[]);
      } else {
        console.error('Failed to retrieve patients:', data.message);
      }        



      } catch (error) {
        console.error('Error fetching user options:', error);
      }
    };

    fetchUserOptions();
  }, []);

  const createChatSessionwithuser = async (selectedUser: string) => {
    try {
      const usern = getSession('username');
      if (!usern) {
        console.error('username not found in session storage');
        return;
      }

      const response = await axios.post(
        `https://${AWS_URL2}.amazonaws.com/prod/chats`,
        {
          "action": 'createchat',
          "username": usern ,
          "touser": selectedUser
        },
        {
          headers: {
            'x-api-key': API_KEY2
          }
        }
      );

      if (response.status === 200 && response.data.sessionId) {
        const sessionid = response.data.sessionId;
        window.location.href = `/Chat/${sessionid}`
      } else {
        console.error('Failed to create a chat session:', response.data.message);
      }
    } catch (error) {
      console.error('Error creating chats session', error);
    }

  };


  const createChatSession = () => {
    setShowModal(true); 
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(''); 
  };

  const handleUserSelection = (selectedValue: string) => {
    console.log(selectedValue);
    setSelectedUser(selectedValue);
  };


  const handleModalSubmit = () => {
    if (selectedUser) {
      createChatSessionwithuser(selectedUser);
      setShowModal(false);
    } else {

      console.error('No user selected');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const hours = ('0' + date.getHours()).slice(-2);
    const minutes = ('0' + date.getMinutes()).slice(-2);
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  };

  return (
    <div className="table-container">
      <h1>List of Chats</h1>
      <div className="button-container">
        <button onClick={createChatSession}>Create Chat</button>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <br /><br />
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Date Created</th>
            <th>Chatting with</th>
          </tr>
        </thead>
        <tbody>
          {chatSessions.map(chat => (
            <tr key={chat.sessionId}>
              <td>{formatDate(chat.datecreated)}</td>
              <td>        
                {getSession('username') === chat.fromuser ? (
                    <Link to={`/Chat/${chat.sessionId}`}>{chat.touser}</Link>
                  ) : getSession('username') === chat.touser ? (
                    <Link to={`/Chat/${chat.sessionId}`}>{chat.fromuser}</Link>
                  ) : null}
             </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Who do you want to contact?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="selectUser">
              <Form.Label>Select User:</Form.Label>
              <Form.Control as="select" value={selectedUser} onChange={(e) => handleUserSelection(e.target.value)}>
                <option value="">Select...</option>
                {userOptions.map((user, index) => (
                  <option key={index} value={user.username}>{user.name}</option>
                ))}
              </Form.Control>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleModalSubmit}>
            Create Chat
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
};

export default ChatsDash;
