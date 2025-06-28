import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const COMPONENTS = [
  '../src/components/MenuPlanner.jsx',
  '../src/components/menu_planner/MenuPreferencesPanel.jsx',
];

describe('DEFAULT_MENU_PREFS imports', () => {
  it('are present in key components', () => {
    COMPONENTS.forEach((file) => {
      const content = fs.readFileSync(path.resolve(__dirname, file), 'utf8');
      expect(content).toMatch(/import\s+\{[^}]*DEFAULT_MENU_PREFS[^}]*\}/);
    });
  });
});
