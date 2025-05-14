
import { useEffect, useState, useRef } from 'react';
import { getSession } from './Auth';
import { API_KEY, AWS_URL2} from '../config';


import './chat.css';
import { Alert } from 'react-bootstrap';

interface ChatMessage {
  username: string;
  msg: string;
  datesent: string;
}

interface ChatInfo {
  sessionId: string;
  datecreated: string;
  touser: string;
  fromuser: string;
}

export const Chat = () => {

  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const currentuser = getSession('username');
  const sessionId: string = window.location.pathname.split('/').pop()!; 
  const [errorMessage, setErrorMessage] = useState<string>('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const prevNumMessages = useRef<number>(0); 
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [fatalerrorMessage, fatalsetErrorMessage] = useState<string>('');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef<boolean>(true);


  useEffect(() => {
    getChatInfo(sessionId);

  }, []);

  const getChattingWith = () => {
    if (!chatInfo) return '';
    if (currentuser === chatInfo.touser) {
      return chatInfo.fromuser;
    } else if (currentuser === chatInfo.fromuser) {
      return chatInfo.touser;
    }
    return '';
  };

  const getChats = async (sessionId: string) => {
    try {
        const response = await fetch(`https://${AWS_URL2}.amazonaws.com/prod/chats`, {
            method: 'POST',
            body: JSON.stringify({
                action: 'getchat',
                session: sessionId,
                username: currentuser
            }),
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
            }
        });

        const data = await response.json();

        if (response.ok) {
            setChats(data.chats); 
        } else {
            console.error('Failed to get message:', data.message);
            setErrorMessage(data.message);
        }
    } catch (error) {
        console.error('Error getting messages:', error);
        setErrorMessage('Error getting message.');
    }
};

const getChatInfo = async (sessionId: string) => {
  try {
    const response = await fetch(`https://${AWS_URL2}.amazonaws.com/prod/chats`, {
      method: 'POST',
      body: JSON.stringify({
        action: 'getchatinfo',
        session: sessionId
      }),
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      }
    });

    const data = await response.json();

    if (response.ok) {
      setChatInfo(data.chatInfo);
    } else {
      console.error('Failed to get chat info:', data.message);
      fatalsetErrorMessage(data.message);
    }
  } catch (error) {
    console.error('Error getting chat info:', error);
    fatalsetErrorMessage('Error getting chat info.');
  }
};

  const addChat = async () => {

    try {
      const response = await fetch(`https://${AWS_URL2}.amazonaws.com/prod/chats`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'addchat',
          username: currentuser,
          session: sessionId,
          value: message
        }),
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
      });

      const data = await response.json();

      if (response.ok) {
        getChats(sessionId);
        setMessage('');
      } else {
        console.error('Failed to send message:', data.message);
        setErrorMessage(data.message);
      }
    } catch (error) {
      console.error('Error sending messages:', error);
      setErrorMessage('Error sending message.');
    }
  };

  useEffect(() => {
    mountedRef.current = true;
  
    const startPolling = async () => {
      await getChatInfo(sessionId);
  
      if (pollingRef.current) {
        clearInterval(pollingRef.current); 
      }
  
      pollingRef.current = setInterval(() => {
        if (!mountedRef.current) {
          console.log('Component unmounted, skipping poll');
          return;
        }
        console.log('Polling getChats...');
        getChats(sessionId);
      }, 3000);
    };
  
    startPolling();
  
    return () => {
      console.log('Unmounting Chat.tsx, clearing interval');
      mountedRef.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [sessionId]);
  
  


  useEffect(() => {

    if (chats.length > prevNumMessages.current) {

      scrollChatToBottom();
    }

    prevNumMessages.current = chats.length;
  }, [chats]);


  const scrollChatToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
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
      {fatalerrorMessage ? (
        <Alert variant="danger">{fatalerrorMessage}</Alert>
      ) : (
        <div className="row justify-content-center">
          <div className="col-md-6 col-md-62">
            <div className="card mt-5">
              <div className="card-header">
                <h5>Chatting with: {getChattingWith()}</h5>
                <p>Conversation started on: {chatInfo ? formatDate(chatInfo.datecreated) : ''}</p>
              </div>
              <div className="card-body">
                <div className="chatbox_timeline" ref={chatContainerRef}>
                  {chats.slice().reverse().map((chat, index) => (
                    <div
                      key={index}
                      className={`chatbox_message ${
                        chat.username === currentuser ? 'chatbox_message--right' : 'chatbox_message--left'
                      } clearfix`}
                    >
                      <img src="/src/Components/images/profile.png" className="chatbox_avatar" />
                      <div className="chatbox_messageval">{chat.msg}</div>
                      <br />
                      <br />
                      <div className="chatbox_timestamp">{formatDate(chat.datesent)}</div>
                    </div>
                  ))}
                </div>
                <div className="chatApp__convSendMessage clearfix">
                  <input
                    type="text"
                    className="chatApp__convInput"
                    placeholder="Type your message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addChat();
                      }
                    }}
                  />
                  <div className="chatApp__convButton " onClick={addChat}>
                    <i className="material-icons">send</i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {errorMessage ? ( 
        <Alert variant="danger">{errorMessage}</Alert>
      ) : (
        ''  
      )}
    </div>
  );
};
  
  export default Chat;
