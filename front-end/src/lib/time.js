import { useEffect, useState } from 'react';

const toMinutes = (hhmm) => {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
};

export const formatClock = (date) =>
  date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

export const formatHhmm = (hhmm) => {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return formatClock(new Date(2026, 0, 1, hours, minutes));
};

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

export const formatLongDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

export function formatDuration(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}

export function toTimeInput(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Today at the given HH:MM.
export function atTime(hhmm) {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function isLineOpen(line, date) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  return minutes >= toMinutes(line.firstTrain) && minutes <= toMinutes(line.lastTrain);
}

export function useNow(intervalMs = 60000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
