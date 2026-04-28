import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

export function SessionLoading({ message = 'Checking session…' }: { message?: string }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '45vh',
        gap: 2,
      }}
    >
      <CircularProgress color="primary" />
      <Typography color="text.secondary">{message}</Typography>
    </Box>
  );
}
