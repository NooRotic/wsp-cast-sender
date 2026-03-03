export interface Project {
  id: string;
  title: string;
  duration: string;
  type: string; // Changed from union type to string for JSON compatibility
  company?: string;
  techStack: string[];
  achievements: string[];
  metrics: Record<string, string | undefined>; // Made values optional
  description: string;
  videoUrl?: string;
  images?: string[];
  imageUrls?: string[]; // New field for image URLs
  thumbnail?: string;
  demoUrl?: string;
  githubUrl?: string;
  embedUrl?: string;
}

export interface ProjectsData {
  projects: Project[];
}
