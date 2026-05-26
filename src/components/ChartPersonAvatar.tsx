import Avatar from '@mui/material/Avatar';

export type ChartPersonAvatarSize = 'input' | 'list' | 'sidebar';

const sizeSx: Record<ChartPersonAvatarSize, { width: number; height: number; fontSize: string }> = {
  input: { width: 28, height: 28, fontSize: '0.75rem' },
  list: { width: 32, height: 32, fontSize: '0.8rem' },
  sidebar: { width: 36, height: 36, fontSize: '0.85rem' },
};

export function ChartPersonAvatar({
  avatarUrl,
  initials,
  size = 'list',
}: {
  avatarUrl: string | null;
  initials: string;
  size?: ChartPersonAvatarSize;
}) {
  const sx = sizeSx[size];
  return (
    <Avatar src={avatarUrl ?? undefined} alt="" sx={{ ...sx, flexShrink: 0 }}>
      {avatarUrl ? null : initials}
    </Avatar>
  );
}
