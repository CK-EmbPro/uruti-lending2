# Analytics Dashboard Enhancements - Implementation Guide

## Overview
This document outlines the implementation of optional enhancements for the Real-Time Analytics Dashboard:
1. WebSocket support for real-time data streaming
2. More chart types (Line, Area charts)
3. Customizable layouts with drag-and-drop

## Implementation Status

### ✅ Backend - WebSocket Support

#### 1. WebSocket Gateway
- **File**: `backend/src/modules/analytics/gateways/analytics.gateway.ts`
- **Features**:
  - JWT authentication for WebSocket connections
  - Real-time metrics broadcasting
  - Client subscription management
  - Filter-based subscriptions

#### 2. Broadcast Service
- **File**: `backend/src/modules/analytics/services/analytics-broadcast.service.ts`
- **Features**:
  - Scheduled broadcasts every 30 seconds
  - Manual broadcast triggers
  - Filter-based broadcasting

#### 3. Enhanced Time-Series Data
- **File**: `backend/src/modules/analytics/services/analytics.service.ts`
- **Enhancements**:
  - Real time-series data calculation
  - Support for day/week/month intervals
  - Historical data aggregation

### ⚠️ Required Package Installation

#### Backend
```bash
cd backend
npm install @nestjs/websockets socket.io
npm install --save-dev @types/socket.io
```

#### Frontend
```bash
cd frontend
npm install socket.io-client
```

### 📋 Frontend Implementation

#### 1. WebSocket Hook
- **File**: `frontend/lib/hooks/useAnalyticsWebSocket.ts`
- **Features**:
  - Automatic connection management
  - JWT token authentication
  - Real-time metrics updates
  - Filter subscription support

#### 2. Enhanced Dashboard Component
- **File**: `frontend/components/features/AnalyticsDashboard.tsx`
- **Enhancements Needed**:
  - Integrate WebSocket hook
  - Add Line and Area charts
  - Add drag-and-drop layout customization
  - Add time-series visualizations

#### 3. Chart Types to Add
- **Line Chart**: For trend analysis over time
- **Area Chart**: For cumulative metrics visualization
- **Multi-line Chart**: For comparing multiple metrics
- **Stacked Area Chart**: For component breakdown

#### 4. Drag-and-Drop Layout
- **Library**: `react-grid-layout` or `@dnd-kit/core`
- **Features**:
  - Drag widgets to reposition
  - Resize widgets
  - Save layout to dashboard
  - Restore saved layouts

## Installation Steps

### Step 1: Install Backend Packages
```bash
cd backend
npm install @nestjs/websockets socket.io
npm install --save-dev @types/socket.io
```

### Step 2: Install Frontend Packages
```bash
cd frontend
npm install socket.io-client
npm install react-grid-layout
npm install --save-dev @types/react-grid-layout
```

### Step 3: Update Environment Variables
Add to `.env`:
```
FRONTEND_URL=http://localhost:3000
WS_URL=http://localhost:3001
```

### Step 4: Update Frontend Environment
Add to `frontend/.env.local`:
```
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

## Usage

### WebSocket Connection
```typescript
const { metrics, isConnected } = useAnalyticsWebSocket({
  filters: { companyId: 'xxx' },
  enabled: true,
  onMetrics: (data) => {
    console.log('New metrics:', data);
  },
});
```

### Time-Series Charts
```typescript
const { data: timeSeries } = useTimeSeries(
  'totalOutstandingLoans',
  filters,
  'day'
);
```

## Next Steps

1. **Install Required Packages** (see above)
2. **Update AnalyticsDashboard Component** to use WebSocket
3. **Add Chart Type Selector** for widgets
4. **Implement Drag-and-Drop** layout customization
5. **Add Layout Save/Restore** functionality
6. **Test WebSocket Connection** in development

## Notes

- WebSocket gateway uses JWT authentication
- Broadcasts occur every 30 seconds automatically
- Clients can subscribe with custom filters
- Time-series data supports day/week/month intervals
- Layout customization requires additional UI components

