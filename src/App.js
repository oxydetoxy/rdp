import React, { useState } from 'react';
import './App.css';

function App() {
  const [sessionId, setSessionId] = useState('');
  const [status, setStatus] = useState('Not connected');
  const [ws, setWs] = useState(null);
  const [screenImage, setScreenImage] = useState(null);

  const connect = () => {
         const socket = new WebSocket('wss://6442d24442fc.ngrok-free.app');
     
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'viewer-join', sessionId }));
      setStatus('Connecting...');
    };
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'session-joined') {
        setStatus('Connected! Waiting for screen...');
      } else if (data.type === 'error') {
        setStatus('Error: ' + data.message);
      } else if (data.type === 'session-ended') {
        setStatus('Session ended by host.');
      } else if (data.type === 'signal') {
        // Handle incoming screen data
        if (data.data && data.data.kind === 'screen') {
          setScreenImage('data:image/png;base64,' + data.data.image);
          setStatus('Connected!');
        }
        // TODO: Handle control signals
      }
    };
    setWs(socket);
  };

  // Helper to send control events
  const sendControl = (event) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'signal', data: { kind: 'control', event } }));
    }
  };

  // Mouse event handlers
  const handleImageClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    sendControl({ type: 'mouse_click', x, y, button: e.button });
  };
  const handleImageMove = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    sendControl({ type: 'mouse_move', x, y });
  };

  // Keyboard event handlers
  const handleKeyDown = (e) => {
    sendControl({ type: 'key_down', key: e.key, code: e.code });
  };
  const handleKeyUp = (e) => {
    sendControl({ type: 'key_up', key: e.key, code: e.code });
  };

 return (
  <div className="App">
    <header className="App-header" style={{ zIndex: 2, position: 'relative' }}>
      <h2>Remote Desktop Viewer</h2>
      <input
        type="text"
        placeholder="Enter session ID"
        value={sessionId}
        onChange={e => setSessionId(e.target.value)}
      />
      <button onClick={connect} disabled={!sessionId || ws}>Connect</button>
      <p>Status: {status}</p>
    </header>
    {screenImage && (
      <img
        src={screenImage}
        alt="Remote Screen"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'contain',
          zIndex: 1
        }}
        tabIndex={0}
        onClick={handleImageClick}
        onMouseMove={handleImageMove}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
      />
    )}
  </div>
);
}

export default App;
