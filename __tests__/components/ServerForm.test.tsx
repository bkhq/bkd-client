import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ServerForm } from '@/components/ServerForm';

describe('ServerForm', () => {
  const defaultProps = {
    visible: true,
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders URL input field', () => {
    const { getByPlaceholderText } = render(<ServerForm {...defaultProps} />);

    expect(getByPlaceholderText('https://')).toBeTruthy();
  });

  it('renders name input field', () => {
    const { getByPlaceholderText } = render(<ServerForm {...defaultProps} />);

    expect(getByPlaceholderText(/名称/)).toBeTruthy();
  });

  it('calls onSubmit with url and name', () => {
    const { getByPlaceholderText, getByTestId } = render(<ServerForm {...defaultProps} />);

    fireEvent.changeText(getByPlaceholderText('https://'), 'https://ai.fr.ds.cc');
    fireEvent.changeText(getByPlaceholderText(/名称/), 'My Server');
    fireEvent.press(getByTestId('submit-button'));

    expect(defaultProps.onSubmit).toHaveBeenCalledWith('https://ai.fr.ds.cc', 'My Server');
  });

  it('calls onSubmit with empty name when not provided', () => {
    const { getByPlaceholderText, getByTestId } = render(<ServerForm {...defaultProps} />);

    fireEvent.changeText(getByPlaceholderText('https://'), 'https://ai.fr.ds.cc');
    fireEvent.press(getByTestId('submit-button'));

    expect(defaultProps.onSubmit).toHaveBeenCalledWith('https://ai.fr.ds.cc', '');
  });

  it('calls onCancel when cancel is pressed', () => {
    const { getByTestId } = render(<ServerForm {...defaultProps} />);

    fireEvent.press(getByTestId('cancel-button'));

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not render when visible is false', () => {
    const { queryByPlaceholderText } = render(
      <ServerForm {...defaultProps} visible={false} />
    );

    expect(queryByPlaceholderText('https://')).toBeNull();
  });

  it('pre-fills fields when editing', () => {
    const { getByDisplayValue } = render(
      <ServerForm
        {...defaultProps}
        initialUrl="https://existing.com"
        initialName="Existing Server"
      />
    );

    expect(getByDisplayValue('https://existing.com')).toBeTruthy();
    expect(getByDisplayValue('Existing Server')).toBeTruthy();
  });
});
