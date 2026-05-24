import React from 'react';
import Box from '@mui/material/Box';

export function NavSectionIcon({ children }: { children: React.ReactNode }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: 32,
        height: 32,
        display: 'grid',
        placeItems: 'center',
        color: 'primary.main',
        flexShrink: 0,
        '& .MuiSvgIcon-root': { fontSize: 20 },
      }}
    >
      {children}
    </Box>
  );
}
