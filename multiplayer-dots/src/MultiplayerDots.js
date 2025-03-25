import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

function MultiplayerDots() {
  const canvasRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [userId, setUserId] = useState(null);
  const [peers, setPeers] = useState({});
  const [localUser, setLocalUser] = useState({ x: 0, y: 0 });

  // Establish socket connection
  useEffect(() => {
    // Replace with your WebSocket server URL
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    // Clean up socket connection
    return () => newSocket.close();
  }, []);

  // Handle socket events
  useEffect(() => {
    if (!socket) return;

    // Listen for user ID assignment
    socket.on('userId', (id) => {
      setUserId(id);
    });

    // Listen for position updates
    socket.on('position', (data) => {
      if (data.userId !== userId) {
        setPeers(prevPeers => ({
          ...prevPeers,
          [data.userId]: { x: data.x, y: data.y }
        }));
      }
    });
  }, [socket, userId]);

  // Canvas drawing and mouse tracking
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Resize canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Draw function
    const drawCanvas = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw local user
      ctx.beginPath();
      ctx.arc(localUser.x, localUser.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'green';
      ctx.fill();

      // Draw other peers
      Object.entries(peers).forEach(([peerId, peer]) => {
        ctx.beginPath();
        ctx.arc(peer.x, peer.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'red';
        ctx.fill();
      });
    };

    // Mouse move handler
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setLocalUser({ x, y });

      // Broadcast position
      if (socket) {
        socket.emit('updatePosition', { 
          userId, 
          x, 
          y 
        });
      }
    };

    // Add event listeners
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousemove', handleMouseMove);
    
    // Initial resize
    resizeCanvas();

    // Animation frame for continuous drawing
    const animationFrame = requestAnimationFrame(drawCanvas);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrame);
    };
  }, [localUser, peers, socket, userId]);

  return (
    <div style={{ margin: 0, overflow: 'hidden' }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%' 
        }} 
      />
      <div 
        style={{ 
          position: 'absolute', 
          top: 10, 
          left: 10, 
          backgroundColor: 'rgba(0,0,0,0.7)', 
          color: 'white', 
          padding: '5px 10px', 
          borderRadius: '5px' 
        }}
      >
        {userId ? `Connected as User ${userId}` : 'Connecting...'}
      </div>
    </div>
  );
}

export default MultiplayerDots;