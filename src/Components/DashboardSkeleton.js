import React from 'react';
import { Heart } from 'lucide-react';

/**
 * DashboardSkeleton - Loading placeholder for dashboard
 *
 * Shows animated skeleton cards that match the real dashboard layout,
 * providing instant visual feedback while data loads.
 */
const DashboardSkeleton = () => {
  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundColor: '#FAF7F2',
        fontFamily: "'DM Sans', sans-serif"
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-30"
        style={{
          backgroundColor: 'rgba(250, 247, 242, 0.97)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #E8E2DA'
        }}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#2D2926' }}
            >
              <Heart className="w-5 h-5 text-white" fill="white" />
            </div>
            <div>
              <h1
                className="text-lg font-semibold"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  color: '#2D2926'
                }}
              >
                TwogetherForward
              </h1>
            </div>
          </div>

          {/* Skeleton buttons */}
          <div className="flex items-center gap-2">
            <SkeletonBox className="w-20 h-10 rounded-lg" />
            <SkeletonBox className="w-32 h-10 rounded-xl" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {/* Hero Section Skeleton */}
        <div className="text-center mb-10">
          <SkeletonBox className="w-48 h-8 mx-auto mb-3 rounded-lg" />
          <SkeletonBox className="w-72 h-5 mx-auto rounded" />
        </div>

        {/* Dream Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <DreamCardSkeleton key={i} delay={i * 0.1} />
          ))}
        </div>

        {/* Stats Sidebar Skeleton (optional, shows on larger screens) */}
        <div className="mt-8 hidden lg:block">
          <div className="flex gap-4">
            <SkeletonBox className="flex-1 h-24 rounded-xl" />
            <SkeletonBox className="flex-1 h-24 rounded-xl" />
            <SkeletonBox className="flex-1 h-24 rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
};

/**
 * Base skeleton box with pulse animation
 */
const SkeletonBox = ({ className = '', style = {} }) => (
  <div
    className={`animate-pulse ${className}`}
    style={{
      backgroundColor: '#E8E2DA',
      ...style
    }}
  />
);

/**
 * Dream card skeleton - matches the real DreamCard layout
 */
const DreamCardSkeleton = ({ delay = 0 }) => (
  <div
    className="rounded-xl p-6 relative overflow-hidden"
    style={{
      backgroundColor: 'white',
      border: '1px solid #E8E2DA',
      animationDelay: `${delay}s`
    }}
  >
    {/* Header */}
    <div className="flex justify-between items-start mb-5">
      <div className="flex-1">
        {/* Status badge */}
        <div className="flex items-center gap-2 mb-2">
          <SkeletonBox className="w-14 h-5 rounded-full" />
          <SkeletonBox className="w-24 h-4 rounded" />
        </div>
        {/* Title */}
        <SkeletonBox className="w-48 h-6 rounded mb-2" />
        {/* Partners */}
        <SkeletonBox className="w-36 h-4 rounded" />
      </div>

      {/* Progress Ring Skeleton */}
      <div className="relative w-14 h-14 flex-shrink-0">
        <div
          className="w-full h-full rounded-full animate-pulse"
          style={{
            border: '4px solid #F5F1EC',
            borderTopColor: '#E8E2DA'
          }}
        />
      </div>
    </div>

    {/* Metrics Grid */}
    <div className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <MetricSkeleton key={i} />
      ))}
    </div>

    {/* Shimmer effect overlay */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        animation: 'shimmer 2s infinite',
      }}
    />
  </div>
);

/**
 * Metric box skeleton
 */
const MetricSkeleton = () => (
  <div
    className="p-3 rounded-lg"
    style={{ backgroundColor: '#FAF7F2' }}
  >
    <div className="flex items-center gap-2 mb-1">
      <SkeletonBox className="w-4 h-4 rounded" />
      <SkeletonBox className="w-16 h-3 rounded" />
    </div>
    <SkeletonBox className="w-12 h-5 rounded" />
  </div>
);

// Add shimmer animation via style tag (will be inserted once)
if (typeof document !== 'undefined' && !document.getElementById('skeleton-styles')) {
  const style = document.createElement('style');
  style.id = 'skeleton-styles';
  style.textContent = `
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `;
  document.head.appendChild(style);
}

export default DashboardSkeleton;
