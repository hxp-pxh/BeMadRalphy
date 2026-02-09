export type PermissionProfile = {
  engine: string;
  flags: string[];
};

export const permissionProfiles: Record<string, PermissionProfile> = {
  claude: {
    engine: 'claude',
    flags: ['--dangerously-skip-permissions'],
  },
  codex: {
    engine: 'codex',
    flags: [],
  },
  cursor: {
    engine: 'cursor',
    flags: [],
  },
  kimi: {
    engine: 'kimi',
    flags: [],
  },
};
