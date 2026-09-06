export interface ProjectUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface ProjectListItem {
  id: string;
  title: string;
  description: string;
  liveUrl: string | null;
  repoUrl: string | null;
  screenshotUrl: string | null;
  viewCount: number;
  createdAt: string;
  user: ProjectUser;
  tags: string[];
}

export interface ProjectsResponse {
  projects: ProjectListItem[];
}

export interface ProjectDetail extends ProjectListItem {
  // Same shape as ProjectListItem from the API
}

export interface ProjectDetailResponse {
  project: ProjectDetail;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  profileViewCount: number;
  createdAt: string;
}

export interface UserProfileProject {
  id: string;
  title: string;
  description: string;
  liveUrl: string | null;
  repoUrl: string | null;
  screenshotUrl: string | null;
  viewCount: number;
  createdAt: string;
  tags?: string[];
}

export interface UserProfileResponse {
  user: UserProfile;
  projects: UserProfileProject[];
}
