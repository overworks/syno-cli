export type TaskStatus =
  | "waiting"
  | "downloading"
  | "paused"
  | "finishing"
  | "finished"
  | "hash_checking"
  | "seeding"
  | "filehosting_waiting"
  | "extracting"
  | "error";

export interface TaskAdditional {
  detail?: {
    destination?: string;
    uri?: string;
    create_time?: number;
    started_time?: number;
    completed_time?: number;
    priority?: string;
    total_peers?: number;
    connected_seeders?: number;
    connected_leechers?: number;
  };
  transfer?: {
    size_downloaded?: number;
    size_uploaded?: number;
    speed_download?: number;
    speed_upload?: number;
  };
  file?: Array<{
    filename: string;
    size: number;
    size_downloaded: number;
    priority: string;
  }>;
}

export interface Task {
  id: string;
  type: string;
  username: string;
  title: string;
  size: number;
  status: TaskStatus;
  additional?: TaskAdditional;
}

export interface TaskListPage {
  offset: number;
  total: number;
  tasks: Task[];
}
