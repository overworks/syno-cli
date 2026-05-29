export interface ShareEntry {
  name: string;
  path: string;
  isdir: boolean;
  additional?: FileEntryAdditional;
}

export interface FileEntry {
  name: string;
  path: string;
  isdir: boolean;
  additional?: FileEntryAdditional;
}

export interface FileEntryAdditional {
  real_path?: string;
  size?: number;
  owner?: { user: string; group: string; uid: number; gid: number };
  time?: { atime: number; mtime: number; ctime: number; crtime: number };
  perm?: { posix: number; share_right?: string };
  type?: string;
}

export interface ListPage<T> {
  total: number;
  offset: number;
  files?: T[];
  shares?: T[];
}

export type Overwrite = boolean | "skip";
