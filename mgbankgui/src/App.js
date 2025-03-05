import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box } from '@mui/material';

function App() {
  const [messages, setMessages] = useState([]);
  const SSE_URL = '/mgbank/accounts/subscribe';  // 상대 경로로 변경
  const SSE_TYPES = [
    { msgBroker: 'RabbitMQ', eventType: 'loans-fallback-queue' },
    { msgBroker: 'Kafka', eventType: 'loans-fallback-topic' },
    { msgBroker: 'RabbitMQ', eventType: 'cards-fallback-queue' },
    { msgBroker: 'Kafka', eventType: 'cards-fallback-topic' }
  ];

  // ------------------------------------------------------------------------------------------------------
  // SSE Management
  const eventSourceRef = useRef();
  const reconnectFrequencySecondRef = useRef(1);
  const setupEventSource = useCallback(() => {
    console.log("[sse] setupEventSource ");
    eventSourceRef.current = new EventSource(SSE_URL);

    SSE_TYPES.forEach((sseConfig) => {
      eventSourceRef.current.addEventListener(sseConfig.eventType, (ret) => {
        const receiveData = JSON.parse(ret.data);
        // BackEnd SSE 초기화 Message :: receiveData === "OK" OR receiveData === "200"
        if (receiveData !== "OK" && receiveData !== "200") {
          if (receiveData.length > 0) {
            const currentTime = new Date().toLocaleString(); // 현재 시간 추가
            const messagesWithTimestamp = receiveData.map((msg) => ({
              ...msg,
              receivedAt: currentTime,
              sseType: sseConfig.eventType,
              msgBroker: sseConfig.msgBroker
            }));
            setMessages((prevMessages) => [...messagesWithTimestamp, ...prevMessages]); // 새로운 메시지를 앞에 추가
          }
        }
      });
    });

    eventSourceRef.current.onopen = (e) => {
      console.log("[sse] open ");
      reconnectFrequencySecondRef.current = 1;
    };
    eventSourceRef.current.onerror = (e) => {
      console.log("[sse] on error ");
      eventSourceRef.current.close();
      console.log("[sse] current Close ");
      reConnectFunc();
    };
    return () => {
      console.log("[sse] close && unmount ");
      eventSourceRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const isFunction = (functionToCheck) => {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
  };
  const debounce = (func, wait) => {
    let timeout;
    let waitFunc;

    return function() {
      console.log("[sse] debounce ");
      if (isFunction(wait)) {
        waitFunc = wait;
      } else {
        waitFunc = function() { 
          return wait;
        };
      }
      const later = () => {
        console.log("[sse] call later() ");
        timeout = null;
        func.apply();
      };
      clearTimeout(timeout);
      console.log("[sse] wait Second :: ", waitFunc());
      timeout = setTimeout(later, waitFunc());
    };
  };

  const reConnectFunc = debounce(function() {
      setupEventSource();
      reconnectFrequencySecondRef.current *= 2;
      console.log("[sse] reconnectFreq :: ", reconnectFrequencySecondRef.current);
      if (reconnectFrequencySecondRef.current >= 64) reconnectFrequencySecondRef.current = 64;
    }, function() {
      console.log("[sse] reconnectFreq X 1000 :: ", reconnectFrequencySecondRef.current * 1000);
      return reconnectFrequencySecondRef.current * 1000
    }
  );
  // SSE Management
  // ------------------------------------------------------------------------------------------------------

  useEffect(() => {
    setupEventSource();
    return () => {
      eventSourceRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box sx={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      boxSizing: 'border-box',
      backgroundColor: '#f4f4f4',
    }}>
      <Typography 
        variant="h4" 
        sx={{
          textAlign: 'center',
          marginBottom: '20px',
          width: '100%'
        }}
      >
        Fallback Messages
      </Typography>

      <TableContainer 
        component={Paper} 
        sx={{
          flexGrow: 1,
          width: 'calc(100% - 40px)',
          margin: '0 20px',
          overflow: 'auto',
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '15%' }}>Received At</TableCell>
              <TableCell sx={{ width: '15%' }}>Message Broker</TableCell>
              <TableCell sx={{ width: '15%' }}>Event Type</TableCell>
              <TableCell sx={{ width: '15%' }}>Correlation ID</TableCell>
              <TableCell sx={{ width: '15%' }}>Mobile Number</TableCell>
              <TableCell sx={{ width: '30%' }}>Fallback Full Message</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {messages.map((msg, index) => (
              <TableRow key={index}>
                <TableCell>{msg.receivedAt}</TableCell>
                <TableCell>{msg.msgBroker}</TableCell>
                <TableCell>{msg.sseType}</TableCell>
                <TableCell>{msg.correlationId}</TableCell>
                <TableCell>{msg.mobileNumber}</TableCell>
                <TableCell>{msg.fallbackMessage}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default App;