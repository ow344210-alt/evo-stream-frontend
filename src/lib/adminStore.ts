export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "CREATOR" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "FLAGGED";
  joinedDate: string;
  avatar: string;
  watchTimeHours: number;
}

export interface AdminCreator {
  id: string;
  name: string;
  email: string;
  channelName: string;
  subscribers: number;
  totalVideos: number;
  totalViews: number;
  status: "ACTIVE" | "SUSPENDED";
  isVerified: boolean;
  avatar: string;
  monthlyRevenue: string;
}

export interface AdminChannel {
  id: string;
  name: string;
  creatorName: string;
  category: string;
  subscribers: number;
  videosCount: number;
  viewsCount: number;
  status: "ACTIVE" | "SUSPENDED";
  logo: string;
  banner: string;
  createdDate: string;
}

export interface AdminVideo {
  id: string;
  title: string;
  channelName: string;
  category: string;
  views: number;
  likes: number;
  duration: string;
  status: "PUBLISHED" | "DRAFT" | "HIDDEN" | "FLAGGED";
  thumbnail: string;
  uploadDate: string;
  resolution: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  videoCount: number;
  featured: boolean;
}

export interface AdminSettings {
  communityGuidelines: string;
  termsAndConditions: string;
  privacyPolicy: string;
  platformName: string;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  defaultHlsBitrate: string;
  maxUploadSizeMb: number;
}

export const INITIAL_USERS: AdminUser[] = [
  {
    id: "usr-101",
    name: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    role: "USER",
    status: "ACTIVE",
    joinedDate: "2026-07-12",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    watchTimeHours: 148,
  },
  {
    id: "usr-102",
    name: "Elena Rostova",
    email: "elena.rostova@cinema.io",
    role: "CREATOR",
    status: "ACTIVE",
    joinedDate: "2026-06-04",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    watchTimeHours: 320,
  },
  {
    id: "usr-103",
    name: "Marcus Vance",
    email: "marcus.vance@orionfilms.com",
    role: "CREATOR",
    status: "ACTIVE",
    joinedDate: "2026-05-18",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    watchTimeHours: 512,
  },
  {
    id: "usr-104",
    name: "David Kim",
    email: "david.kim@streamer.net",
    role: "USER",
    status: "SUSPENDED",
    joinedDate: "2026-04-20",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    watchTimeHours: 42,
  },
  {
    id: "usr-105",
    name: "Sophia Martinez",
    email: "sophia.m@indiefilms.org",
    role: "USER",
    status: "ACTIVE",
    joinedDate: "2026-08-01",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    watchTimeHours: 89,
  },
];

export const INITIAL_CREATORS: AdminCreator[] = [
  {
    id: "crt-201",
    name: "Karan Johar Studio",
    email: "karan@kjfilms.com",
    channelName: "Karan Johar Originals",
    subscribers: 284500,
    totalVideos: 34,
    totalViews: 8420000,
    status: "ACTIVE",
    isVerified: true,
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    monthlyRevenue: "$14,820",
  },
  {
    id: "crt-202",
    name: "Apex Cine Labs",
    email: "support@apexcine.com",
    channelName: "Apex Thrillers",
    subscribers: 194200,
    totalVideos: 28,
    totalViews: 6150000,
    status: "ACTIVE",
    isVerified: true,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    monthlyRevenue: "$9,450",
  },
  {
    id: "crt-203",
    name: "Orion Pictures",
    email: "contact@orion-sci.com",
    channelName: "Orion Sci-Fi Studio",
    subscribers: 142000,
    totalVideos: 19,
    totalViews: 4890000,
    status: "ACTIVE",
    isVerified: true,
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    monthlyRevenue: "$7,800",
  },
  {
    id: "crt-204",
    name: "Blackwood Films",
    email: "director@blackwood.tv",
    channelName: "Blackwood Arthouse",
    subscribers: 88400,
    totalVideos: 15,
    totalViews: 2310000,
    status: "SUSPENDED",
    isVerified: false,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    monthlyRevenue: "$3,100",
  },
];

export const INITIAL_CHANNELS: AdminChannel[] = [
  {
    id: "chn-301",
    name: "Karan Johar Originals",
    creatorName: "Karan Johar Studio",
    category: "Action & Drama",
    subscribers: 284500,
    videosCount: 34,
    viewsCount: 8420000,
    status: "ACTIVE",
    logo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80",
    createdDate: "2026-02-14",
  },
  {
    id: "chn-302",
    name: "Apex Thrillers",
    creatorName: "Apex Cine Labs",
    category: "Mystery & Thriller",
    subscribers: 194200,
    videosCount: 28,
    viewsCount: 6150000,
    status: "ACTIVE",
    logo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
    createdDate: "2026-03-01",
  },
  {
    id: "chn-303",
    name: "Orion Sci-Fi Studio",
    creatorName: "Orion Pictures",
    category: "Sci-Fi & Fantasy",
    subscribers: 142000,
    videosCount: 19,
    viewsCount: 4890000,
    status: "ACTIVE",
    logo: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
    createdDate: "2026-04-10",
  },
  {
    id: "chn-304",
    name: "Blackwood Arthouse",
    creatorName: "Blackwood Films",
    category: "Art-House Cinema",
    subscribers: 88400,
    videosCount: 15,
    viewsCount: 2310000,
    status: "SUSPENDED",
    logo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80",
    createdDate: "2026-05-22",
  },
];

export const INITIAL_VIDEOS: AdminVideo[] = [
  {
    id: "vid-401",
    title: "RANA - The Untold",
    channelName: "Karan Johar Originals",
    category: "Drama",
    views: 1480000,
    likes: 89400,
    duration: "1h 52m",
    status: "PUBLISHED",
    thumbnail: "/images/rana_poster.jpg",
    uploadDate: "2026-08-15",
    resolution: "4K UHD (60fps)",
  },
  {
    id: "vid-402",
    title: "SHADOWS",
    channelName: "Apex Thrillers",
    category: "Thriller",
    views: 2150000,
    likes: 124000,
    duration: "2h 08m",
    status: "PUBLISHED",
    thumbnail: "/images/shadows_poster.png",
    uploadDate: "2026-08-10",
    resolution: "4K UHD (60fps)",
  },
  {
    id: "vid-403",
    title: "BEYOND THE HORIZON",
    channelName: "Orion Sci-Fi Studio",
    category: "Sci-Fi",
    views: 980000,
    likes: 67200,
    duration: "1h 44m",
    status: "PUBLISHED",
    thumbnail: "/images/beyond_horizon_poster.jpg",
    uploadDate: "2026-07-28",
    resolution: "4K UHD (Dolby Vision)",
  },
  {
    id: "vid-404",
    title: "CITY OF FACES",
    channelName: "Blackwood Arthouse",
    category: "Mystery",
    views: 450000,
    likes: 31000,
    duration: "1h 58m",
    status: "HIDDEN",
    thumbnail: "/images/city_faces_poster.jpg",
    uploadDate: "2026-07-14",
    resolution: "1080p HD",
  },
  {
    id: "vid-405",
    title: "THE LAST LIGHT",
    channelName: "NeoWave Cinema",
    category: "Mystery",
    views: 1120000,
    likes: 78500,
    duration: "2h 14m",
    status: "PUBLISHED",
    thumbnail: "/images/the_last_light_poster.png",
    uploadDate: "2026-08-20",
    resolution: "4K UHD",
  },
  {
    id: "vid-406",
    title: "MAA",
    channelName: "Vivid Frame Studios",
    category: "Drama",
    views: 740000,
    likes: 54000,
    duration: "1h 40m",
    status: "PUBLISHED",
    thumbnail: "/images/maa_poster.jpg",
    uploadDate: "2026-08-22",
    resolution: "4K UHD",
  },
];

export const INITIAL_CATEGORIES: AdminCategory[] = [
  {
    id: "cat-1",
    name: "Action & Adventure",
    slug: "action-adventure",
    description: "High-octane blockbusters, adrenaline chases, and heroic epics.",
    icon: "zap",
    videoCount: 1420,
    featured: true,
  },
  {
    id: "cat-2",
    name: "Drama & Cinema",
    slug: "drama-cinema",
    description: "Emotionally compelling human stories and character portraits.",
    icon: "film",
    videoCount: 2890,
    featured: true,
  },
  {
    id: "cat-3",
    name: "Sci-Fi & Cosmic",
    slug: "sci-fi-cosmic",
    description: "Futuristic explorations, space journeys, and quantum mysteries.",
    icon: "rocket",
    videoCount: 940,
    featured: true,
  },
  {
    id: "cat-4",
    name: "Psychological Thrillers",
    slug: "thrillers",
    description: "Mind-bending twists, noir suspense, and dark mysteries.",
    icon: "eye",
    videoCount: 1680,
    featured: true,
  },
  {
    id: "cat-5",
    name: "Documentary & Real World",
    slug: "documentary",
    description: "In-depth explorations of culture, science, nature, and truth.",
    icon: "compass",
    videoCount: 820,
    featured: false,
  },
];

export const INITIAL_SETTINGS: AdminSettings = {
  platformName: "EVO Video Network",
  maintenanceMode: false,
  allowNewRegistrations: true,
  defaultHlsBitrate: "4K_60FPS_ADAPTIVE",
  maxUploadSizeMb: 10240,
  communityGuidelines: `# EVO Community Guidelines

Welcome to EVO. We empower diverse filmmakers and creative storytellers worldwide.

### 1. Respect & Safety
- Hate speech, harassment, or direct threats are strictly prohibited.
- Content depicting graphic gratuitous violence or illegal activities will be terminated immediately.

### 2. Copyright & Original Works
- Creators must own or have explicit licensing rights to all uploaded footage, audio scores, and visual effects.
- Direct copyright strikes will trigger automated channel suspensions.

### 3. Transparent Monetization
- Creators retain up to 67% of direct subscription and pay-per-view revenues without undisclosed deductions.`,

  termsAndConditions: `# EVO Terms & Conditions

### 1. Platform License
By uploading content to EVO, creators grant EVO a non-exclusive worldwide streaming license for digital distribution.

### 2. Subscriber Accounts
Users agree to maintain secure credentials and not resell or scrape platform streams.

### 3. Payout Cycles
Creator earnings are calculated weekly and disbursed automatically via verified Stripe or direct bank transfer.`,

  privacyPolicy: `# EVO Privacy Policy

### 1. Data Collection
We collect minimal telemetry necessary to provide high-definition adaptive HLS bitrate streaming.

### 2. No Third-Party Reselling
EVO never sells user behavioral data or viewer history to external ad networks.

### 3. GDPR & CCPA Compliance
Users can request instant data export or complete account deletion from their account settings.`,
};
