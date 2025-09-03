# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

请用中文输出。

/mcp__serena__initial_instructions

## Project Overview

**加拿大快递配送区域地图系统** - A React-based Canadian postal delivery map visualization system using Statistics Canada's official FSA boundary data. The system provides interactive visualization and management of postal delivery regions across Canada.

## Core Architecture

### Technology Stack

- **Frontend Framework**: React 18 with Vite
- **Styling**: Tailwind CSS with cyber/tech theme
- **Map Engine**: Leaflet + React Leaflet
- **State Management**: React hooks + localStorage unified storage
- **Desktop**: Electron for desktop app packaging
- **Animations**: Framer Motion

### Data Architecture

The system uses a **Unified Storage Architecture** (`src/utils/unifiedStorage.js`) that provides:

- Centralized localStorage management for FSA data, regions, and postal codes
- Real-time data synchronization across components
- Data recovery and integrity checking mechanisms
- Event-driven updates via `dataUpdateNotifier`

### Key Concepts

- **FSA (Forward Sortation Area)**: First 3 characters of Canadian postal codes (e.g., "M5V")
- **Region Management**: Custom grouping of FSAs for delivery zone configuration
- **Price Configuration**: Weight-based pricing per region with batch import/export

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (port 3001)
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview

# Electron desktop app
npm run electron-dev    # Development with hot reload
npm run build-electron  # Build desktop app
npm run dist           # Build and package for distribution
```

## Project Structure

```
src/
├── components/           # React components
│   ├── AccurateFSAMap.jsx       # Main map component with FSA boundaries
│   ├── RegionManagementPanel.jsx # Region configuration UI
│   ├── RegionPriceManager.jsx    # Price management interface
│   ├── EnhancedSearchPanel.jsx   # Search and filtering
│   └── ImportExportManager.jsx   # Data import/export functionality
├── data/                # Static data files
│   ├── deliverableFSA.js        # FSA delivery zones
│   ├── fsaStats.js              # FSA statistics
│   └── postalCodes.js           # Postal code database
├── utils/               # Utility modules
│   ├── unifiedStorage.js        # Core storage management
│   ├── dataUpdateNotifier.js    # Event system for data changes
│   ├── dataRecovery.js          # Data integrity and recovery
│   ├── quotationGenerator.js    # Price calculation engine
│   └── apiClient.js             # HTTP client for backend
└── App.jsx              # Main application component
```

## Critical Implementation Details

### Unified Storage System

All data operations MUST go through `unifiedStorage.js`:

```javascript
import { getRegionConfig, updateRegionConfig, getRegionPostalCodes } from './utils/unifiedStorage.js';
```

### Data Update Notifications

Components must subscribe to data changes:

```javascript
import { dataUpdateNotifier } from './utils/dataUpdateNotifier';

useEffect(() => {
  const unsubscribe = dataUpdateNotifier.subscribe((updateInfo) => {
    // Handle data updates
  });
  return () => unsubscribe();
}, []);
```

### FSA Data Format

```javascript
{
  fsa: 'M5V',
  province: 'ON', 
  city: 'Toronto',
  lat: 43.6426,
  lng: -79.3871,
  postalCodes: ['M5V 3A8', 'M5V 1A1', ...]
}
```

### Region Configuration

```javascript
{
  id: 'region-uuid',
  name: 'Toronto Downtown',
  fsa: ['M5V', 'M5G', ...],
  postalCodes: ['M5V 3A8', ...],
  prices: {
    '0-10': { base: 15.99, perKg: 1.2 },
    '10-20': { base: 25.99, perKg: 1.0 }
  }
}
```

## Cursor AI Integration

The project includes advanced Cursor AI rules in `.cursor/rules/project-controller.mdc` that define:

- BMad Method workflow with 9-step optimized process
- Self-contained Context management for instant development restoration
- Multi-agent orchestration system (@pm, @architect, @dev, @qa, etc.)
- TDD support and quality gates

When working with Cursor, use `@project-controller` to activate the intelligent development assistant.

## Map Data Sources

- **FSA Boundaries**: Statistics Canada 2021 Census boundary files
- **Coordinate System**: WGS84 (EPSG:4326)
- **Map Tiles**: CartoDB Dark Matter for cyber theme
- **Default View**: Canada centered at [56.1304, -106.3468], zoom level 4

## Performance Considerations

- Map renders ~1600 FSA polygons - use viewport culling for optimization
- LocalStorage operations are batched to prevent UI blocking
- Search/filter operations use debouncing (300ms default)
- Large data imports process in chunks of 100 items

## Testing Approach

While no test framework is currently configured, the codebase follows patterns that support testing:

- Components are functional with clear prop interfaces
- Business logic is extracted to utility modules
- Data operations go through centralized storage layer

## Common Development Tasks

### Adding New FSA Data

1. Update `src/data/deliverableFSA.js` with FSA boundaries
2. Add postal codes to `src/data/postalCodes.js`
3. Run data validation: Check browser console for integrity reports on app start

### Modifying Region Prices

1. Use RegionPriceManager component UI
2. Or directly update via `updateRegionConfig()` in unifiedStorage
3. Changes auto-sync across all components via dataUpdateNotifier

### Debugging Data Issues

1. Check browser DevTools > Application > Local Storage
2. Look for keys: `fsa_*`, `region_*`, `postalCodes_*`
3. Use `checkDataIntegrity()` from dataRecovery.js
4. Recovery available via `recoverLegacyData()` if needed

## Deployment Notes

- Production build outputs to `dist/` directory
- Electron builds to `dist-electron/`
- All assets use relative paths for file:// protocol compatibility
- Environment agnostic - no server-side dependencies for core functionality
