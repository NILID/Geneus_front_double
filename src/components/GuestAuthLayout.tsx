import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import guestAuthBackground from '../assets/images/guest-auth-background.jpg';

type GuestAuthLayoutProps = {
  children: ReactNode;
};

/**
 * Full-viewport background for pages shown when the user is not logged in.
 * Image uses cover + center to avoid distortion; a dark overlay keeps UI readable.
 */
export function GuestAuthLayout({ children }: GuestAuthLayoutProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          bgcolor: 'grey.900',
          backgroundImage: `url(${guestAuthBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          bgcolor: 'rgba(15, 23, 32, 0.62)',
        }}
      />
      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
