import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NudgeButton from '../../Components/Tasks/NudgeButton';

// Mock the supabaseService
jest.mock('../../services/supabaseService', () => ({
  sendNudge: jest.fn()
}));

import { sendNudge } from '../../services/supabaseService';

describe('NudgeButton', () => {
  const mockTask = {
    id: 'task-123',
    title: 'Book venue'
  };

  const mockRecipientId = 'user-456';
  const mockRecipientName = 'Sarah';
  const mockOnNudgeSent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the nudge button', () => {
    render(
      <NudgeButton
        task={mockTask}
        recipientId={mockRecipientId}
        recipientName={mockRecipientName}
      />
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('opens modal when clicked', () => {
    render(
      <NudgeButton
        task={mockTask}
        recipientId={mockRecipientId}
        recipientName={mockRecipientName}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText(`Nudge ${mockRecipientName}`)).toBeInTheDocument();
    expect(screen.getByText(`About: ${mockTask.title}`)).toBeInTheDocument();
  });

  it('shows three nudge type options', () => {
    render(
      <NudgeButton
        task={mockTask}
        recipientId={mockRecipientId}
        recipientName={mockRecipientName}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('Gentle')).toBeInTheDocument();
    expect(screen.getByText('Friendly')).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });

  it('sends nudge when form submitted', async () => {
    sendNudge.mockResolvedValue({ error: null });

    render(
      <NudgeButton
        task={mockTask}
        recipientId={mockRecipientId}
        recipientName={mockRecipientName}
        onNudgeSent={mockOnNudgeSent}
      />
    );

    // Open modal
    fireEvent.click(screen.getByRole('button'));

    // Click send
    fireEvent.click(screen.getByText('Send Nudge'));

    await waitFor(() => {
      expect(sendNudge).toHaveBeenCalledWith(
        mockTask.id,
        mockRecipientId,
        expect.any(String),
        'gentle'
      );
    });
  });

  it('shows success message after sending', async () => {
    sendNudge.mockResolvedValue({ error: null });

    render(
      <NudgeButton
        task={mockTask}
        recipientId={mockRecipientId}
        recipientName={mockRecipientName}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Send Nudge'));

    await waitFor(() => {
      expect(screen.getByText(`Nudge sent to ${mockRecipientName}!`)).toBeInTheDocument();
    });
  });

  it('allows selecting different nudge types', () => {
    render(
      <NudgeButton
        task={mockTask}
        recipientId={mockRecipientId}
        recipientName={mockRecipientName}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    // Select urgent type
    fireEvent.click(screen.getByText('Urgent'));

    // Check that urgent is now selected (has specific styling)
    const urgentButton = screen.getByText('Urgent').closest('button');
    expect(urgentButton).toHaveStyle({ background: expect.stringContaining('c76b6b') });
  });

  it('closes modal when cancel clicked', () => {
    render(
      <NudgeButton
        task={mockTask}
        recipientId={mockRecipientId}
        recipientName={mockRecipientName}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(`Nudge ${mockRecipientName}`)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByText(`Nudge ${mockRecipientName}`)).not.toBeInTheDocument();
  });
});
