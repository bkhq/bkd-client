import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { ServerForm } from '@/components/ServerForm'

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

describe('serverForm', () => {
  const defaultProps = {
    visible: true,
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders URL input field', () => {
    const { getByPlaceholderText } = render(<ServerForm {...defaultProps} />)

    expect(getByPlaceholderText('https://')).toBeTruthy()
  })

  it('renders name input field with label', () => {
    const { getByPlaceholderText, getByText } = render(<ServerForm {...defaultProps} />)

    expect(getByText('名称（可选）')).toBeTruthy()
    expect(getByPlaceholderText('我的服务器')).toBeTruthy()
  })

  it('calls onSubmit with url and name', () => {
    const { getByPlaceholderText, getByTestId } = render(<ServerForm {...defaultProps} />)

    fireEvent.changeText(getByPlaceholderText('https://'), 'https://ai.fr.ds.cc')
    fireEvent.changeText(getByPlaceholderText('我的服务器'), 'My Server')
    fireEvent.press(getByTestId('submit-button'))

    expect(defaultProps.onSubmit).toHaveBeenCalledWith('https://ai.fr.ds.cc', 'My Server')
  })

  it('calls onSubmit with empty name when not provided', () => {
    const { getByPlaceholderText, getByTestId } = render(<ServerForm {...defaultProps} />)

    fireEvent.changeText(getByPlaceholderText('https://'), 'https://ai.fr.ds.cc')
    fireEvent.press(getByTestId('submit-button'))

    expect(defaultProps.onSubmit).toHaveBeenCalledWith('https://ai.fr.ds.cc', '')
  })

  it('calls onCancel when cancel is pressed', () => {
    const { getByTestId } = render(<ServerForm {...defaultProps} />)

    fireEvent.press(getByTestId('cancel-button'))

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
  })

  it('does not render when visible is false', () => {
    const { queryByPlaceholderText } = render(
      <ServerForm {...defaultProps} visible={false} />,
    )

    expect(queryByPlaceholderText('https://')).toBeNull()
  })

  it('pre-fills fields when editing', () => {
    const { getByDisplayValue } = render(
      <ServerForm
        {...defaultProps}
        initialUrl="https://existing.com"
        initialName="Existing Server"
      />,
    )

    expect(getByDisplayValue('https://existing.com')).toBeTruthy()
    expect(getByDisplayValue('Existing Server')).toBeTruthy()
  })
})
