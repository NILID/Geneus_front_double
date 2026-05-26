/**
 * Contract tests: fail CI if someone wires family-chart edit clicks the naive way again.
 */
import fs from 'fs';
import path from 'path';

const editorPath = path.join(__dirname, '../components/FamilyChartEditor.tsx');

describe('FamilyChartEditor family-chart wiring contract', () => {
  const src = fs.readFileSync(editorPath, 'utf8');

  it('must not call editTree.setCardClickOpen directly', () => {
    expect(src).not.toMatch(/\.setCardClickOpen\s*\(/);
  });

  it('must wire card clicks through wireFamilyChartCardClickForEdit', () => {
    expect(src).toContain('wireFamilyChartCardClickForEdit');
  });

  it('must bind DOM isolation for mini-tree / branch icons in setOnCardUpdate', () => {
    expect(src).toContain('bindFamilyChartAuxiliaryClickIsolation');
  });
});
