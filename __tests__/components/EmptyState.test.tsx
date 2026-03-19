import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { EmptyState } from '@/components/EmptyState'

jest.mock('@/context/ThemeContext', () => ({
  // eslint-disable-next-line react/no-unnecessary-use-prefix -- mock must match real export name
  useTheme: () => ({
    mode: 'dark',
    isDark: true,
    colors: {
      background: '#1a1a2e',
      surface: '#2a2a3e',
      text: '#ffffff',
      textSecondary: '#888888',
      border: '#3b3b5c',
      primary: '#3b82f6',
      toolbarBg: '#1a1a2e',
      toolbarText: '#ffffff',
      toolbarBorder: '#3b3b5c',
      pillBg: '#2a2a3e',
      statusBarStyle: 'light',
    },
    setMode: jest.fn(),
  }),
}))

describe('emptyState', () => {
  it('renders empty state message', () => {
    const { getByText } = render(<EmptyState onAddServer={() => {}} />)

    expect(getByText('尚未添加服务器')).toBeTruthy()
  })

  it('renders BKD logo/title', () => {
    const { getByText } = render(<EmptyState onAddServer={() => {}} />)

    expect(getByText('BKD')).toBeTruthy()
  })

  it('calls onAddServer when add button is pressed', () => {
    const onAddServer = jest.fn()
    const { getByTestId } = render(<EmptyState onAddServer={onAddServer} />)

    fireEvent.press(getByTestId('add-server-button'))

    expect(onAddServer).toHaveBeenCalledTimes(1)
  })
})
