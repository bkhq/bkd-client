import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ServerList } from '@/components/ServerList';
import type { Server } from '@/types/server';

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    mode: 'dark',
    isDark: true,
    colors: {
      background: '#1a1a2e', surface: '#2a2a3e', text: '#ffffff',
      textSecondary: '#888888', border: '#3b3b5c', primary: '#3b82f6',
      toolbarBg: '#1a1a2e', toolbarText: '#ffffff', toolbarBorder: '#3b3b5c',
      pillBg: '#2a2a3e', statusBarStyle: 'light',
    },
    setMode: jest.fn(),
  }),
}));

const mockServers: Server[] = [
  { id: '1', name: 'Server Alpha', url: 'https://alpha.example.com', createdAt: 2000 },
  { id: '2', name: 'Server Beta', url: 'https://beta.example.com', createdAt: 1000 },
];

describe('ServerList', () => {
  const defaultProps = {
    servers: mockServers,
    onSelect: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onAdd: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all servers', () => {
    const { getByText } = render(<ServerList {...defaultProps} />);

    expect(getByText('Server Alpha')).toBeTruthy();
    expect(getByText('Server Beta')).toBeTruthy();
  });

  it('displays server URLs', () => {
    const { getByText } = render(<ServerList {...defaultProps} />);

    expect(getByText('https://alpha.example.com')).toBeTruthy();
    expect(getByText('https://beta.example.com')).toBeTruthy();
  });

  it('calls onSelect with server when item is pressed', () => {
    const { getByText } = render(<ServerList {...defaultProps} />);

    fireEvent.press(getByText('Server Alpha'));

    expect(defaultProps.onSelect).toHaveBeenCalledWith(mockServers[0]);
  });

  it('renders add button', () => {
    const { getByTestId } = render(<ServerList {...defaultProps} />);

    expect(getByTestId('add-server-button')).toBeTruthy();
  });

  it('calls onAdd when add button is pressed', () => {
    const { getByTestId } = render(<ServerList {...defaultProps} />);

    fireEvent.press(getByTestId('add-server-button'));

    expect(defaultProps.onAdd).toHaveBeenCalledTimes(1);
  });
});
