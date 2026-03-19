import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { WebViewScreen } from '@/components/WebViewScreen'

// Mock react-native-webview
jest.mock('react-native-webview', () => {
  const ReactMock = require('react')
  const { View } = require('react-native')
  const MockWebView = ({ ref, ...props }: { ref: React.Ref<unknown>, [key: string]: unknown }) => {
    ReactMock.useImperativeHandle(ref, () => ({
      reload: jest.fn(),
    }))
    return <View testID="webview" {...props} />
  }
  MockWebView.displayName = 'MockWebView'
  return { WebView: MockWebView }
})

// Mock safe area
jest.mock('react-native-safe-area-context', () => ({
  // eslint-disable-next-line react/no-unnecessary-use-prefix -- mock must match real export name
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

// Mock expo-web-browser
jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn().mockResolvedValue({ type: 'success' }),
}))

// Mock ThemeContext
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

describe('webViewScreen', () => {
  const defaultProps = {
    url: 'https://ai.fr.ds.cc',
    onHomePress: jest.fn(),
    onMorePress: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders WebView with correct URL', () => {
    const { getByTestId } = render(<WebViewScreen {...defaultProps} />)

    const webview = getByTestId('webview')
    expect(webview.props.source).toEqual({ uri: 'https://ai.fr.ds.cc' })
    expect(webview.props.hideKeyboardAccessoryView).toBe(true)
  })

  it('renders refresh button', () => {
    const { getByTestId } = render(<WebViewScreen {...defaultProps} />)

    expect(getByTestId('refresh-button')).toBeTruthy()
  })

  it('renders menu button', () => {
    const { getByTestId } = render(<WebViewScreen {...defaultProps} />)

    expect(getByTestId('menu-button')).toBeTruthy()
  })

  it('calls onMorePress when menu button is pressed', () => {
    const { getByTestId } = render(<WebViewScreen {...defaultProps} />)

    fireEvent.press(getByTestId('menu-button'))

    expect(defaultProps.onMorePress).toHaveBeenCalledTimes(1)
  })

  it('calls onHomePress when home button is pressed', () => {
    const { getByTestId } = render(<WebViewScreen {...defaultProps} />)

    fireEvent.press(getByTestId('home-button'))

    expect(defaultProps.onHomePress).toHaveBeenCalledTimes(1)
  })

  it('shows error state with retry button on load failure', () => {
    const { getByTestId, queryByTestId } = render(<WebViewScreen {...defaultProps} />)

    const webview = getByTestId('webview')
    fireEvent(webview, 'error', { nativeEvent: { description: 'Network error' } })

    expect(getByTestId('error-view')).toBeTruthy()
    expect(queryByTestId('retry-button')).toBeTruthy()
  })
})
