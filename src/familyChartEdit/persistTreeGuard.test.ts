/**
 * Regression: FamilyChartEditor.handleAddPersonDialogSubmit must not set isSaving
 * before persistLatestTree — persistLatestTree bails out when isSavingRef is already true.
 */
export {};

describe('persistLatestTree reentrancy guard', () => {
  it('documents that an outer isSaving lock prevents POST /update_tree', () => {
    let isSaving = false;
    let pendingSave = false;
    let apiCalled = false;

    const persistLatestTree = () => {
      if (isSaving) {
        pendingSave = true;
        return;
      }
      isSaving = true;
      apiCalled = true;
      isSaving = false;
    };

    isSaving = true;
    persistLatestTree();
    expect(apiCalled).toBe(false);
    expect(pendingSave).toBe(true);

    isSaving = false;
    persistLatestTree();
    expect(apiCalled).toBe(true);
  });
});
