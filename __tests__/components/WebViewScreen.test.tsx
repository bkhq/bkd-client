import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WebViewScreen } from '@/components/WebViewScreen';

// Mock react-native-webview
jest.mock('react-native-webview', () => {
  const ReactMock = require('react');
  const { View } = require('react-native');
  const MockWebView = ReactMock.forwardRef((props: any, ref: any) => {
    ReactMock.useImperativeHandle(ref, () => ({
      reload: jest.fn(),
    }));
    return <View testID="webview" {...props} />;
  });
  MockWebView.displayName = 'MockWebView';
  return { WebView: MockWebView };
});

// Mock safe area
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('WebViewScreen', () => {
  const defaultProps = {
    url: 'https://ai.fr.ds.cc',
    onMenuPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders WebView with correct URL', () => {
    const { getByTestId } = render(<WebViewScreen {...defaultProps} />);

    const webview = getByTestId('webview');
    expect(webview.props.source).toEqual({ uri: 'https://ai.fr.ds.cc' });
  });

  it('renders refresh button', () => {
    const { getByTestId } = render(<WebViewScreen {...defaultProps} />);

    expect(getByTestId('refresh-button')).toBeTruthy();
  });

  it('renders menu button', () => {
    const { getByTestId } = render(<WebViewScreen {...defaultProps} />);

    expect(getByTestId('menu-button')).toBeTruthy();
  });

  it('calls onMenuPress when menu button is pressed', () => {
    const { getByTestId } = render(<WebViewScreen {...defaultProps} />);

    fireEvent.press(getByTestId('menu-button'));

    expect(defaultProps.onMenuPress).toHaveBeenCalledTimes(1);
  });

  it('shows error state with retry button on load failure', () => {
    const { getByTestId, queryByTestId } = render(<WebViewScreen {...defaultProps} />);

    const webview = getByTestId('webview');
    fireEvent(webview, 'error', { nativeEvent: { description: 'Network error' } });

    expect(getByTestId('error-view')).toBeTruthy();
    expect(queryByTestId('retry-button')).toBeTruthy();
  });
});
