import {
  subscribe,
  unsubscribe,
  unsubscribeAll,
  getStats,
  hasSubscription
} from '../../utils/subscriptionManager';

describe('subscriptionManager', () => {
  beforeEach(() => {
    // Clean up before each test
    unsubscribeAll();
  });

  afterEach(() => {
    // Clean up after each test
    unsubscribeAll();
  });

  describe('subscribe', () => {
    it('creates a new subscription', () => {
      const mockSetupFn = jest.fn(() => ({
        unsubscribe: jest.fn()
      }));

      subscribe('test-channel', mockSetupFn);

      expect(mockSetupFn).toHaveBeenCalled();
      expect(hasSubscription('test-channel')).toBe(true);
    });

    it('reuses existing subscription for same channel', () => {
      const mockSetupFn = jest.fn(() => ({
        unsubscribe: jest.fn()
      }));

      subscribe('test-channel', mockSetupFn);
      subscribe('test-channel', mockSetupFn);

      // Should only be called once
      expect(mockSetupFn).toHaveBeenCalledTimes(1);
    });

    it('increments ref count on reuse', () => {
      const mockSetupFn = jest.fn(() => ({
        unsubscribe: jest.fn()
      }));

      subscribe('test-channel', mockSetupFn);
      subscribe('test-channel', mockSetupFn);

      const stats = getStats();
      const sub = stats.subscriptions.find(s => s.name === 'test-channel');
      expect(sub.refCount).toBe(2);
    });
  });

  describe('unsubscribe', () => {
    it('decrements ref count', () => {
      const mockUnsubscribe = jest.fn();
      const mockSetupFn = jest.fn(() => ({
        unsubscribe: mockUnsubscribe
      }));

      subscribe('test-channel', mockSetupFn);
      subscribe('test-channel', mockSetupFn);
      unsubscribe('test-channel');

      const stats = getStats();
      const sub = stats.subscriptions.find(s => s.name === 'test-channel');
      expect(sub.refCount).toBe(1);
      expect(mockUnsubscribe).not.toHaveBeenCalled();
    });

    it('removes subscription when ref count reaches zero', () => {
      const mockUnsubscribe = jest.fn();
      const mockSetupFn = jest.fn(() => ({
        unsubscribe: mockUnsubscribe
      }));

      subscribe('test-channel', mockSetupFn);
      unsubscribe('test-channel');

      expect(hasSubscription('test-channel')).toBe(false);
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('force unsubscribes regardless of ref count', () => {
      const mockUnsubscribe = jest.fn();
      const mockSetupFn = jest.fn(() => ({
        unsubscribe: mockUnsubscribe
      }));

      subscribe('test-channel', mockSetupFn);
      subscribe('test-channel', mockSetupFn);
      unsubscribe('test-channel', true); // Force

      expect(hasSubscription('test-channel')).toBe(false);
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('handles non-existent channel gracefully', () => {
      expect(() => unsubscribe('non-existent')).not.toThrow();
    });
  });

  describe('unsubscribeAll', () => {
    it('removes all subscriptions', () => {
      const mockSetupFn = jest.fn(() => ({
        unsubscribe: jest.fn()
      }));

      subscribe('channel-1', mockSetupFn);
      subscribe('channel-2', mockSetupFn);
      subscribe('channel-3', mockSetupFn);

      unsubscribeAll();

      expect(getStats().total).toBe(0);
    });

    it('calls unsubscribe on all channels', () => {
      const mockUnsubscribe1 = jest.fn();
      const mockUnsubscribe2 = jest.fn();

      subscribe('channel-1', () => ({ unsubscribe: mockUnsubscribe1 }));
      subscribe('channel-2', () => ({ unsubscribe: mockUnsubscribe2 }));

      unsubscribeAll();

      expect(mockUnsubscribe1).toHaveBeenCalled();
      expect(mockUnsubscribe2).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('returns correct subscription count', () => {
      const mockSetupFn = jest.fn(() => ({
        unsubscribe: jest.fn()
      }));

      subscribe('channel-1', mockSetupFn);
      subscribe('channel-2', mockSetupFn);

      const stats = getStats();
      expect(stats.total).toBe(2);
      expect(stats.subscriptions).toHaveLength(2);
    });

    it('includes subscription age', () => {
      const mockSetupFn = jest.fn(() => ({
        unsubscribe: jest.fn()
      }));

      subscribe('test-channel', mockSetupFn);

      const stats = getStats();
      const sub = stats.subscriptions[0];
      expect(sub.age).toBeGreaterThanOrEqual(0);
      expect(sub.age).toBeLessThan(1000); // Less than 1 second
    });
  });

  describe('hasSubscription', () => {
    it('returns true for existing subscription', () => {
      subscribe('test-channel', () => ({ unsubscribe: jest.fn() }));
      expect(hasSubscription('test-channel')).toBe(true);
    });

    it('returns false for non-existent subscription', () => {
      expect(hasSubscription('non-existent')).toBe(false);
    });
  });
});
