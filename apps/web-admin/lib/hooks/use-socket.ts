'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getSocketAuthTokenAction } from '../auth/actions';

const DEFAULT_API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? '/api/backend'
    : 'https://backend-production-87e6.up.railway.app/v1';
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_BASE_URL;
const WS_URL = API_BASE_URL.replace(/\/v\d+$/, '').replace(/\/api$/, '');

export interface UseSocketOptions {
  enabled?: boolean;
}

export function useSocket(options?: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const enabled = options?.enabled !== false;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let cancelled = false;
    let socket: Socket | null = null;

    getSocketAuthTokenAction().then((token) => {
      if (cancelled || !token) return;

      socket = io(WS_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 50,
      });

      socket.on('connect', () => {
        setConnected(true);
        setSocket(socket);
      });
      socket.on('disconnect', () => {
        setConnected(false);
        setSocket(null);
      });
      socket.on('connect_error', () => {
        setConnected(false);
        setSocket(null);
      });

      socketRef.current = socket;
    });

    return () => {
      cancelled = true;
      socket?.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [enabled]);

  const on = useCallback(
    (event: string, handler: (...args: unknown[]) => void) => {
      const socket = socketRef.current;
      if (!socket) return;
      socket.on(event, handler);
      return () => {
        socket.off(event, handler);
      };
    },
    [],
  );

  const emit = useCallback((event: string, ...args: unknown[]) => {
    socketRef.current?.emit(event, ...args);
  }, []);

  const joinRoom = useCallback(
    (room: string) => {
      emit('room.join', { room });
    },
    [emit],
  );

  const leaveRoom = useCallback(
    (room: string) => {
      emit('room.leave', { room });
    },
    [emit],
  );

  return { socket, connected, on, emit, joinRoom, leaveRoom };
}
