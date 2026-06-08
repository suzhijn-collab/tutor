import {
  notifyPostLike,
  notifyNewComment,
  notifyCommentLike,
} from './notificationService';

export interface DiscussionComment {
  id: string;
  content: string;
  author: string;
  authorAvatar: string;
  timestamp: string;
  likedBy: string[];
}

export interface DiscussionPost {
  id: string;
  title: string;
  content: string;
  images: string[];
  author: string;
  authorAvatar: string;
  subject: string;
  tag: string;
  timestamp: string;
  likedBy: string[];
  comments: DiscussionComment[];
  isPinned: boolean;
  isResolved: boolean;
}

const STORAGE_KEY = 'tutor_discussion_posts';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function getBeijingTime(): string {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const beijing = new Date(utc + 3600000 * 8);
  return beijing.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getPosts(): DiscussionPost[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePosts(posts: DiscussionPost[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

export function createPost(
  post: Omit<DiscussionPost, 'id' | 'timestamp' | 'likedBy' | 'comments' | 'isPinned' | 'isResolved'>
): DiscussionPost[] {
  const posts = getPosts();
  const newPost: DiscussionPost = {
    ...post,
    id: generateId(),
    timestamp: getBeijingTime(),
    likedBy: [],
    comments: [],
    isPinned: false,
    isResolved: false,
  };
  posts.unshift(newPost);
  savePosts(posts);
  return posts;
}

export function toggleLikePost(postId: string, userName: string): DiscussionPost[] {
  const posts = getPosts();
  const post = posts.find((p) => p.id === postId);
  if (post) {
    const idx = post.likedBy.indexOf(userName);
    if (idx >= 0) {
      post.likedBy.splice(idx, 1);
    } else {
      post.likedBy.push(userName);
      // 通知帖子作者（排除自己赞自己）
      notifyPostLike(post.author, userName, '', postId, post.title);
    }
  }
  savePosts(posts);
  return posts;
}

export function addComment(
  postId: string,
  comment: Omit<DiscussionComment, 'id' | 'timestamp' | 'likedBy'>
): DiscussionPost[] {
  const posts = getPosts();
  const post = posts.find((p) => p.id === postId);
  if (post) {
    post.comments.push({
      ...comment,
      id: generateId(),
      timestamp: getBeijingTime(),
      likedBy: [],
    });
    // 通知帖子作者（排除自己评论自己）
    notifyNewComment(post.author, comment.author, comment.authorAvatar, postId, post.title);
  }
  savePosts(posts);
  return posts;
}

export function toggleLikeComment(
  postId: string,
  commentId: string,
  userName: string
): DiscussionPost[] {
  const posts = getPosts();
  const post = posts.find((p) => p.id === postId);
  if (post) {
    const comment = post.comments.find((c) => c.id === commentId);
    if (comment) {
      const idx = comment.likedBy.indexOf(userName);
      if (idx >= 0) {
        comment.likedBy.splice(idx, 1);
      } else {
        comment.likedBy.push(userName);
        // 通知评论作者（排除自己赞自己）
        notifyCommentLike(comment.author, userName, '', commentId);
      }
    }
  }
  savePosts(posts);
  return posts;
}

export function deletePost(postId: string): DiscussionPost[] {
  const posts = getPosts().filter((p) => p.id !== postId);
  savePosts(posts);
  return posts;
}

export function togglePinPost(postId: string): DiscussionPost[] {
  const posts = getPosts();
  const post = posts.find((p) => p.id === postId);
  if (post) {
    post.isPinned = !post.isPinned;
  }
  savePosts(posts);
  return posts;
}

export function toggleResolvePost(postId: string): DiscussionPost[] {
  const posts = getPosts();
  const post = posts.find((p) => p.id === postId);
  if (post) {
    post.isResolved = !post.isResolved;
  }
  savePosts(posts);
  return posts;
}
