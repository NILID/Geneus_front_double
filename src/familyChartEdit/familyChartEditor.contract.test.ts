/**
 * Contract tests: fail CI if someone wires family-chart edit clicks the naive way again.
 */
import fs from 'fs';
import path from 'path';

const editorPath = path.join(__dirname, '../components/FamilyChartEditor.tsx');
const chartPagePath = path.join(__dirname, '../pages/FamilyChartPage.tsx');
const editorSrc = fs.readFileSync(editorPath, 'utf8');
const chartPageSrc = fs.readFileSync(chartPagePath, 'utf8');

describe('FamilyChartEditor family-chart wiring contract', () => {
  const src = editorSrc;

  it('must not call editTree.setCardClickOpen directly', () => {
    expect(src).not.toMatch(/\.setCardClickOpen\s*\(/);
  });

  it('must wire card clicks through wireFamilyChartCardClickForRelativeAdd (not built-in edit form)', () => {
    expect(src).toContain('wireFamilyChartCardClickForRelativeAdd');
    expect(src).not.toContain('wireFamilyChartCardClickForEdit');
  });

  it('must use external add-person dialog instead of family-chart setFields/setPostSubmit', () => {
    expect(src).toContain('FamilyChartAddPersonDialog');
    expect(src).not.toMatch(/\.setFields\s*\(/);
    expect(src).not.toMatch(/\.setPostSubmit\s*\(/);
  });

  it('must bind DOM isolation for mini-tree / branch icons in setOnCardUpdate', () => {
    expect(src).toContain('bindFamilyChartAuxiliaryClickIsolation');
  });

  it('shows add-relative control only when not read-only and card is main', () => {
    expect(src).toMatch(/!readOnly\s*&&\s*isMainCard/);
    expect(src).toContain('canEditGenealogy');
  });
});

describe('FamilyChartPage role gating', () => {
  it('passes readOnly from canEditGenealogy to the editor', () => {
    expect(chartPageSrc).toContain('canEditGenealogy');
    expect(chartPageSrc).toMatch(/treeReadOnly\s*=\s*!canEditGenealogy/);
    expect(chartPageSrc).toContain('readOnly={treeReadOnly}');
  });
});
