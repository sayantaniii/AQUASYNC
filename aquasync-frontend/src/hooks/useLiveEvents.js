import { useEffect, useRef, useState } from 'react';

const API_ROOT = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
  : 'http://localhost:5000';

export function useLiveEvents(onEvent) {
  const [connected, setConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    let eventSource = null;
    let retryTimer = null;

    function connect() {
      try {
        eventSource = new EventSource(`${API_ROOT}/api/events`);

        eventSource.addEventListener('connected', () => {
          setConnected(true);
        });

        eventSource.addEventListener('created', (e) => {
          try {
            const data = JSON.parse(e.data);
            setLastNotification({
              type: 'created',
              title: 'New Incident Reported',
              message: `${data.issueType?.replace(/_/g, ' ') || 'Incident'} reported at ${data.location}`,
              data,
              time: new Date().toLocaleTimeString(),
            });
            if (onEventRef.current) onEventRef.current('created', data);
          } catch (err) {
            console.error('Error parsing SSE event:', err);
          }
        });

        eventSource.addEventListener('assigned', (e) => {
          try {
            const data = JSON.parse(e.data);
            setLastNotification({
              type: 'assigned',
              title: 'Incident Assigned',
              message: `Report ${data.referenceCode} assigned to crew`,
              data,
              time: new Date().toLocaleTimeString(),
            });
            if (onEventRef.current) onEventRef.current('assigned', data);
          } catch (err) {
            console.error('Error parsing SSE event:', err);
          }
        });

        eventSource.addEventListener('status_changed', (e) => {
          try {
            const data = JSON.parse(e.data);
            setLastNotification({
              type: 'status_changed',
              title: 'Status Updated',
              message: `Report ${data.referenceCode} marked as ${data.status}`,
              data,
              time: new Date().toLocaleTimeString(),
            });
            if (onEventRef.current) onEventRef.current('status_changed', data);
          } catch (err) {
            console.error('Error parsing SSE event:', err);
          }
        });

        eventSource.addEventListener('sensor_anomaly', (e) => {
          try {
            const data = JSON.parse(e.data);
            setLastNotification({
              type: 'sensor_anomaly',
              title: '⚠️ Water Sensor Anomaly Alert',
              message: `${data.sensor?.name} detected ${data.sensor?.current_value} ${data.sensor?.unit}!`,
              data,
              time: new Date().toLocaleTimeString(),
            });
            if (onEventRef.current) onEventRef.current('sensor_anomaly', data);
          } catch (err) {
            console.error('Error parsing SSE event:', err);
          }
        });

        eventSource.onerror = () => {
          setConnected(false);
          if (eventSource) eventSource.close();
          // Auto retry connection after 4 seconds
          retryTimer = setTimeout(connect, 4000);
        };
      } catch {
        setConnected(false);
        retryTimer = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      if (eventSource) eventSource.close();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  return { connected, lastNotification, clearNotification: () => setLastNotification(null) };
}
