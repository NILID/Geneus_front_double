import React from 'react';
import Box from '@mui/material/Box';
import { AccountSettingsForm } from '../components/AccountSettingsForm';

export function AccountSettingsPage() {
  return (
    <Box sx={{ maxWidth: 560, mx: 'auto', py: 3, px: 2 }}>
      <AccountSettingsForm title="Учётная запись" fieldIdPrefix="account-page" />
    </Box>
  );
}
