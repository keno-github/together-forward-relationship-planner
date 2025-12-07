import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PartnerProgress from '../../Components/Partner/PartnerProgress';

describe('PartnerProgress', () => {
  const mockPartnerInfo = {
    user_id: 'user-1',
    partner_id: 'user-2',
    partner1_name: 'Alex',
    partner2_name: 'Sarah'
  };

  const mockUserContext = {
    partner1: 'Alex',
    partner2: 'Sarah'
  };

  const createMockTasks = (options = {}) => {
    const {
      alexCompleted = 2,
      alexTotal = 4,
      sarahCompleted = 3,
      sarahTotal = 5,
      sharedCompleted = 1,
      sharedTotal = 2
    } = options;

    const tasks = [];

    // Alex's tasks
    for (let i = 0; i < alexTotal; i++) {
      tasks.push({
        id: `alex-task-${i}`,
        title: `Alex Task ${i}`,
        assigned_to: 'Alex',
        assigned_to_user_id: 'user-1',
        completed: i < alexCompleted,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Sarah's tasks
    for (let i = 0; i < sarahTotal; i++) {
      tasks.push({
        id: `sarah-task-${i}`,
        title: `Sarah Task ${i}`,
        assigned_to: 'Sarah',
        assigned_to_user_id: 'user-2',
        completed: i < sarahCompleted,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Shared tasks
    for (let i = 0; i < sharedTotal; i++) {
      tasks.push({
        id: `shared-task-${i}`,
        title: `Shared Task ${i}`,
        assigned_to: null,
        assigned_to_user_id: null,
        completed: i < sharedCompleted
      });
    }

    return tasks;
  };

  it('renders nothing when no tasks', () => {
    const { container } = render(
      <PartnerProgress
        tasks={[]}
        partnerInfo={mockPartnerInfo}
        userContext={mockUserContext}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders partner progress header', () => {
    const tasks = createMockTasks();

    render(
      <PartnerProgress
        tasks={tasks}
        partnerInfo={mockPartnerInfo}
        userContext={mockUserContext}
      />
    );

    expect(screen.getByText('Partner Progress')).toBeInTheDocument();
  });

  it('shows total completed tasks', () => {
    const tasks = createMockTasks({
      alexCompleted: 2,
      sarahCompleted: 3,
      sharedCompleted: 1
    });

    render(
      <PartnerProgress
        tasks={tasks}
        partnerInfo={mockPartnerInfo}
        userContext={mockUserContext}
      />
    );

    // 2 + 3 + 1 = 6 completed, 4 + 5 + 2 = 11 total
    expect(screen.getByText('6 of 11 tasks')).toBeInTheDocument();
  });

  it('shows partner names', () => {
    const tasks = createMockTasks();

    render(
      <PartnerProgress
        tasks={tasks}
        partnerInfo={mockPartnerInfo}
        userContext={mockUserContext}
      />
    );

    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('Sarah')).toBeInTheDocument();
  });

  it('shows shared tasks section when present', () => {
    const tasks = createMockTasks({ sharedTotal: 2 });

    render(
      <PartnerProgress
        tasks={tasks}
        partnerInfo={mockPartnerInfo}
        userContext={mockUserContext}
      />
    );

    expect(screen.getByText('Shared Tasks')).toBeInTheDocument();
  });

  it('calculates correct percentages', () => {
    const tasks = createMockTasks({
      alexCompleted: 2,
      alexTotal: 4,  // 50%
      sarahCompleted: 3,
      sarahTotal: 5  // 60%
    });

    render(
      <PartnerProgress
        tasks={tasks}
        partnerInfo={mockPartnerInfo}
        userContext={mockUserContext}
      />
    );

    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('shows comparison bar when both partners have tasks', () => {
    const tasks = createMockTasks();

    render(
      <PartnerProgress
        tasks={tasks}
        partnerInfo={mockPartnerInfo}
        userContext={mockUserContext}
      />
    );

    expect(screen.getByText('Contribution')).toBeInTheDocument();
  });

  it('identifies leading partner', () => {
    const tasks = createMockTasks({
      alexCompleted: 4,
      alexTotal: 4,  // 100%
      sarahCompleted: 1,
      sarahTotal: 5  // 20%
    });

    render(
      <PartnerProgress
        tasks={tasks}
        partnerInfo={mockPartnerInfo}
        userContext={mockUserContext}
      />
    );

    expect(screen.getByText('Alex leading')).toBeInTheDocument();
  });

  it('shows overdue count when tasks are overdue', () => {
    const tasks = [
      {
        id: 'task-1',
        title: 'Overdue Task',
        assigned_to: 'Alex',
        assigned_to_user_id: 'user-1',
        completed: false,
        due_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Past date
      }
    ];

    render(
      <PartnerProgress
        tasks={tasks}
        partnerInfo={mockPartnerInfo}
        userContext={mockUserContext}
      />
    );

    expect(screen.getByText('1 overdue')).toBeInTheDocument();
  });

  it('uses userContext when partnerInfo is not available', () => {
    const tasks = createMockTasks();

    render(
      <PartnerProgress
        tasks={tasks}
        partnerInfo={null}
        userContext={mockUserContext}
      />
    );

    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('Sarah')).toBeInTheDocument();
  });
});
