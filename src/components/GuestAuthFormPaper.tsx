import type { ReactNode } from 'react';
import Paper, { type PaperProps } from '@mui/material/Paper';

/** Narrow white halo around the dark card so it separates from the photo */
const formOutlineGlow =
  '0 0 0 1px rgba(255, 255, 255, 0.2), 0 0 28px rgba(255, 255, 255, 0.09)';

type GuestAuthFormPaperProps = Omit<PaperProps, 'elevation'> & {
  children?: ReactNode;
};

export function GuestAuthFormPaper({ children, sx, ...rest }: GuestAuthFormPaperProps) {
  return (
    <Paper
      elevation={0}
      sx={[
        {
          p: { xs: 2, sm: 4 },
          bgcolor: 'background.paper',
          boxShadow: formOutlineGlow,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...rest}
    >
      {children}
    </Paper>
  );
}
