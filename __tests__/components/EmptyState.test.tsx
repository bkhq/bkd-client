import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { EmptyState } from '@/components/EmptyState';

describe('EmptyState', () => {
  it('renders empty state message', () => {
    const { getByText } = render(<EmptyState onAddServer={() => {}} />);

    expect(getByText('尚未添加服务器')).toBeTruthy();
  });

  it('renders BitK logo/title', () => {
    const { getByText } = render(<EmptyState onAddServer={() => {}} />);

    expect(getByText('BitK')).toBeTruthy();
  });

  it('calls onAddServer when add button is pressed', () => {
    const onAddServer = jest.fn();
    const { getByTestId } = render(<EmptyState onAddServer={onAddServer} />);

    fireEvent.press(getByTestId('add-server-button'));

    expect(onAddServer).toHaveBeenCalledTimes(1);
  });
});
