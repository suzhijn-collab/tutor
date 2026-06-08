import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Users,
  Star,
  Plus,
  ArrowRight,
  ThumbsUp,
  MessageCircle,
  X,
  Image as ImageIcon,
  Send,
  CheckCircle,
  Pin,
  Search,
} from 'lucide-react';
import {
  getPosts,
  createPost,
  toggleLikePost,
  addComment,
  toggleLikeComment,
  deletePost,
  togglePinPost,
  toggleResolvePost,
  type DiscussionPost,
  type DiscussionComment,
} from '@/src/services/discussionService';
import { getUserDisplayName, getUserAvatar } from '@/src/services/settingsService';

function getCurrentUser() {
  return {
    name: getUserDisplayName(),
    avatar: getUserAvatar(),
  };
}

const SUBJECTS = ['高数', '线性代数', 'Python', '深度学习'];
const TAGS = ['🆕 新问题', '🔥 急需', '💡 分享', '❓ 求助'];

type FilterType = 'latest' | 'pinned' | 'unsolved';

export default function Discussion({ searchQuery = '', onClearSearch }: { searchQuery?: string; onClearSearch?: () => void }) {
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterType>('latest');
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  useEffect(() => {
    setPosts(getPosts());
  }, []);

  const handleCreatePost = (
    title: string,
    content: string,
    images: string[],
    subject: string,
    tag: string,
  ) => {
    const updated = createPost({
      title,
      content,
      images,
      author: getCurrentUser().name,
      authorAvatar: getCurrentUser().avatar,
      subject,
      tag,
    });
    setPosts(updated);
    setShowCreateModal(false);
  };

  const handleLikePost = (postId: string) => {
    const updated = toggleLikePost(postId, getCurrentUser().name);
    setPosts(updated);
  };

  const handleAddComment = (postId: string, content: string) => {
    const updated = addComment(postId, {
      content,
      author: getCurrentUser().name,
      authorAvatar: getCurrentUser().avatar,
    });
    setPosts(updated);
  };

  const handleLikeComment = (postId: string, commentId: string) => {
    const updated = toggleLikeComment(postId, commentId, getCurrentUser().name);
    setPosts(updated);
  };

  const handleDeletePost = (postId: string) => {
    const updated = deletePost(postId);
    setPosts(updated);
  };

  const handlePinPost = (postId: string) => {
    const updated = togglePinPost(postId);
    setPosts(updated);
  };

  const handleResolvePost = (postId: string) => {
    const updated = toggleResolvePost(postId);
    setPosts(updated);
  };

  const toggleCommentsExpanded = (postId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const filteredPosts = (() => {
    let result = posts;
    // 先按筛选器过滤
    if (filter === 'pinned') {
      result = result.filter((p) => p.isPinned);
    } else if (filter === 'unsolved') {
      result = result.filter((p) => !p.isResolved);
    }
    // 再按搜索词过滤
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.subject.toLowerCase().includes(q) ||
          p.tag.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q)
      );
    }
    return result;
  })();

  const totalParticipants = posts.reduce((sum, p) => sum + p.comments.length + 1, 0);
  const pinnedPost = posts.filter((p) => p.isPinned).sort((a, b) => b.likedBy.length - a.likedBy.length)[0]
    || [...posts].sort((a, b) => b.likedBy.length - a.likedBy.length)[0];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 soul-gradient rounded-2xl flex items-center justify-center text-white shadow-lg">
            <MessageSquare size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-on-surface tracking-tight font-sans">
              讨论区
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              与 {totalParticipants} 位同学一起探索知识的边界
            </p>
          </div>
        </div>
        <div className="flex space-x-2 bg-surface-container-low p-1.5 rounded-full">
          {(['latest', 'pinned', 'unsolved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                filter === f
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {{ latest: '最新', pinned: '精华', unsolved: '未解决' }[f]}
            </button>
          ))}
        </div>
      </div>

      {/* 搜索结果提示 */}
      {searchQuery.trim() && (
        <div className="flex items-center gap-3 mb-6 px-4 py-3 bg-primary/5 rounded-2xl border border-primary/10">
          <Search size={18} className="text-primary" />
          <span className="text-sm font-bold text-primary">
            搜索「{searchQuery}」找到 {filteredPosts.length} 个相关帖子
          </span>
          <button
            onClick={() => onClearSearch?.()}
            className="ml-auto p-1 rounded-full hover:bg-primary/10 text-primary transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-8 space-y-6">
          {filteredPosts.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 shadow-sm border border-surface-container text-center">
              <MessageSquare size={48} className="mx-auto mb-4 text-on-surface-variant/30" />
              <p className="text-on-surface-variant font-medium">还没有讨论帖，快来发布第一个问题吧！</p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isCommentsExpanded={expandedComments.has(post.id)}
                onToggleComments={() => toggleCommentsExpanded(post.id)}
                onLike={() => handleLikePost(post.id)}
                onAddComment={(content) => handleAddComment(post.id, content)}
                onLikeComment={(commentId) => handleLikeComment(post.id, commentId)}
                onDelete={() => handleDeletePost(post.id)}
                onPin={() => handlePinPost(post.id)}
                onResolve={() => handleResolvePost(post.id)}
                isAdmin={true}
                onImageClick={(img) => setEnlargedImage(img)}
                isLiked={post.likedBy.includes(getCurrentUser().name)}
              />
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {pinnedPost && (
            <div className="bg-secondary-container/30 rounded-[2rem] p-8 border border-secondary-container/50">
              <div className="flex items-center space-x-2 mb-6 text-secondary font-bold">
                <Star size={20} fill="currentColor" />
                <span className="text-sm">精华解析</span>
              </div>
              <h3 className="font-bold text-on-surface text-lg mb-4 line-clamp-2">
                {pinnedPost.title}
              </h3>
              {pinnedPost.images.length > 0 && (
                <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-6">
                  <img
                    src={pinnedPost.images[0]}
                    alt="Post"
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setEnlargedImage(pinnedPost.images[0])}
                  />
                </div>
              )}
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6 line-clamp-3">
                {pinnedPost.content}
              </p>
              <button
                onClick={() => {
                  toggleCommentsExpanded(pinnedPost.id);
                }}
                className="w-full py-3 bg-secondary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                查看详情 <ArrowRight size={16} />
              </button>
            </div>
          )}

          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-surface-container">
            <h3 className="font-bold text-on-surface mb-6 flex items-center gap-2">
              <Users size={20} className="text-primary" />
              活跃贡献者
            </h3>
            <div className="space-y-4">
              {(() => {
                const authorStats = new Map<
                  string,
                  { name: string; avatar: string; score: number }
                >();
                posts.forEach((p) => {
                  const existing = authorStats.get(p.author);
                  const score = p.likedBy.length + p.comments.length;
                  authorStats.set(p.author, {
                    name: p.author,
                    avatar: p.authorAvatar,
                    score: (existing?.score ?? 0) + score,
                  });
                });
                return Array.from(authorStats.values())
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 3)
                  .map((c) => (
                    <Contributor
                      key={c.name}
                      name={c.name}
                      role={c.name === getCurrentUser().name ? '你' : '贡献者'}
                      points={c.score}
                      avatar={c.avatar}
                    />
                  ));
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-10 right-10 w-16 h-16 soul-gradient text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-50"
      >
        <Plus size={32} />
      </button>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreatePost}
        />
      )}

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-8"
          onClick={() => setEnlargedImage(null)}
        >
          <button
            className="absolute top-6 right-6 text-white/80 hover:text-white p-2 rounded-full bg-white/10"
            onClick={() => setEnlargedImage(null)}
          >
            <X size={28} />
          </button>
          <img
            src={enlargedImage}
            alt="Enlarged"
            className="max-w-full max-h-full rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

/* ==================== PostCard ==================== */

interface PostCardProps {
  post: DiscussionPost;
  isCommentsExpanded: boolean;
  onToggleComments: () => void;
  onLike: () => void;
  onAddComment: (content: string) => void;
  onLikeComment: (commentId: string) => void;
  onDelete: () => void;
  onPin: () => void;
  onResolve: () => void;
  isAdmin: boolean;
  onImageClick: (img: string) => void;
  isLiked: boolean;
}

function PostCard({
  post,
  isCommentsExpanded,
  onToggleComments,
  onLike,
  onAddComment,
  onLikeComment,
  onDelete,
  onPin,
  onResolve,
  isAdmin,
  onImageClick,
  isLiked,
}: PostCardProps) {
  const isOwner = post.author === getCurrentUser().name;

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-surface-container group hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex space-x-3">
          {post.isPinned && (
            <span className="px-4 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 flex items-center gap-1">
              <Star size={12} fill="currentColor" /> 精华
            </span>
          )}
          {post.isResolved && (
            <span className="px-4 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1">
              <CheckCircle size={12} /> 已解决
            </span>
          )}
          <span className="px-4 py-1 rounded-full text-xs font-bold bg-surface-container text-on-surface-variant">
            {post.tag}
          </span>
          <span className="px-4 py-1 bg-surface-container text-on-surface-variant rounded-full text-xs font-bold">
            {post.subject}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Admin pin toggle */}
          {isAdmin && (
            <button
              onClick={onPin}
              className={`p-1.5 rounded-full transition-all ${
                post.isPinned
                  ? 'text-yellow-500 bg-yellow-50'
                  : 'text-on-surface-variant/30 hover:text-yellow-500 hover:bg-yellow-50'
              }`}
              title={post.isPinned ? '取消精华' : '授予精华'}
            >
              <Star size={16} fill={post.isPinned ? 'currentColor' : 'none'} />
            </button>
          )}
          {/* Resolve toggle */}
          <button
            onClick={onResolve}
            className={`p-1.5 rounded-full transition-all ${
              post.isResolved
                ? 'text-green-500 bg-green-50'
                : 'text-on-surface-variant/30 hover:text-green-500 hover:bg-green-50'
            }`}
            title={post.isResolved ? '标记未解决' : '标记已解决'}
          >
            <CheckCircle size={16} fill={post.isResolved ? 'currentColor' : 'none'} />
          </button>
          {isOwner && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-full text-on-surface-variant/40 hover:text-red-500 hover:bg-red-50 transition-all"
              title="删除"
            >
              <X size={16} />
            </button>
          )}
          <span className="text-xs text-on-surface-variant/60 font-medium">{post.timestamp}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold mb-4 text-on-surface group-hover:text-primary transition-colors leading-snug">
        {post.title}
      </h3>

      {/* Content */}
      <p className="text-on-surface-variant text-sm mb-6 leading-relaxed whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Images */}
      {post.images.length > 0 && (
        <div className="flex gap-3 mb-6 overflow-x-auto">
          {post.images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`${idx + 1}`}
              className="w-24 h-24 rounded-xl object-cover cursor-pointer border border-surface-container hover:scale-105 transition-transform flex-shrink-0"
              onClick={() => onImageClick(img)}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-surface-container">
        <div className="flex items-center gap-3">
          <img
            src={post.authorAvatar}
            alt={post.author}
            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
            referrerPolicy="no-referrer"
          />
          <span className="text-sm font-bold text-on-surface">{post.author}</span>
        </div>
        <div className="flex space-x-6 text-on-surface-variant">
          <button
            onClick={onLike}
            className={`flex items-center space-x-1.5 transition-colors ${
              isLiked ? 'text-primary' : 'hover:text-primary'
            }`}
          >
            <ThumbsUp size={18} fill={isLiked ? 'currentColor' : 'none'} />
            <span className="text-xs font-bold">{post.likedBy.length}</span>
          </button>
          <button
            onClick={onToggleComments}
            className={`flex items-center space-x-1.5 transition-colors ${
              isCommentsExpanded ? 'text-primary' : 'hover:text-primary'
            }`}
          >
            <MessageCircle size={18} />
            <span className="text-xs font-bold">{post.comments.length}</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {isCommentsExpanded && (
        <CommentSection
          comments={post.comments}
          onLikeComment={onLikeComment}
          onAddComment={onAddComment}
        />
      )}
    </div>
  );
}

/* ==================== CommentSection ==================== */

interface CommentSectionProps {
  comments: DiscussionComment[];
  onLikeComment: (commentId: string) => void;
  onAddComment: (content: string) => void;
}

function CommentSection({ comments, onLikeComment, onAddComment }: CommentSectionProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onAddComment(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-surface-container">
      {/* Existing Comments */}
      {comments.length > 0 && (
        <div className="space-y-4 mb-5">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <img
                src={comment.authorAvatar}
                alt={comment.author}
                className="w-7 h-7 rounded-full mt-0.5 flex-shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-on-surface">
                    {comment.author}
                  </span>
                  <span className="text-[10px] text-on-surface-variant/50">
                    {comment.timestamp}
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed break-words">
                  {comment.content}
                </p>
                <button
                  onClick={() => onLikeComment(comment.id)}
                  className={`mt-1.5 flex items-center gap-1 text-xs transition-colors ${
                    comment.likedBy.includes(getCurrentUser().name)
                      ? 'text-primary'
                      : 'text-on-surface-variant/50 hover:text-primary'
                  }`}
                >
                  <ThumbsUp
                    size={12}
                    fill={
                      comment.likedBy.includes(getCurrentUser().name)
                        ? 'currentColor'
                        : 'none'
                    }
                  />
                  {comment.likedBy.length > 0 && (
                    <span>{comment.likedBy.length}</span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment Input */}
      <div className="flex items-center gap-3">
        <img
          src={getCurrentUser().avatar}
          alt={getCurrentUser().name}
          className="w-7 h-7 rounded-full flex-shrink-0"
          referrerPolicy="no-referrer"
        />
        <div className="flex-1 flex items-center gap-2 bg-surface-container-low rounded-full px-4 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="写下你的评论…"
            className="flex-1 bg-transparent text-sm outline-none text-on-surface placeholder:text-on-surface-variant/50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="text-primary disabled:text-on-surface-variant/30 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==================== CreatePostModal ==================== */

interface CreatePostModalProps {
  onClose: () => void;
  onSubmit: (
    title: string,
    content: string,
    images: string[],
    subject: string,
    tag: string,
  ) => void;
}

const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

function CreatePostModal({ onClose, onSubmit }: CreatePostModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [tag, setTag] = useState(TAGS[0]);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remaining = MAX_IMAGES - images.length;
    const toProcess = Array.from(files).slice(0, remaining);

    if (files.length > remaining) {
      setError(`最多只能上传 ${MAX_IMAGES} 张图片`);
    } else {
      setError('');
    }

    toProcess.forEach((file) => {
      if (file.size > MAX_IMAGE_SIZE) {
        setError('图片大小不能超过 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('请输入标题');
      return;
    }
    onSubmit(title.trim(), content.trim(), images, subject, tag);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-on-surface font-sans">发布新问题</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container transition-colors"
          >
            <X size={20} className="text-on-surface-variant" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-2 mb-4">
            {error}
          </div>
        )}

        {/* Subject & Tag */}
        <div className="flex gap-3 mb-4">
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1 bg-surface-container-low rounded-xl px-4 py-2.5 text-sm font-medium outline-none cursor-pointer"
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="flex-1 bg-surface-container-low rounded-xl px-4 py-2.5 text-sm font-medium outline-none cursor-pointer"
          >
            {TAGS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="问题标题"
          className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm font-bold outline-none mb-4 placeholder:text-on-surface-variant/50"
        />

        {/* Content */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="详细描述你的问题…"
          rows={4}
          className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm outline-none resize-none mb-4 placeholder:text-on-surface-variant/50"
        />

        {/* Images */}
        {images.length > 0 && (
          <div className="flex gap-3 mb-4 flex-wrap">
            {images.map((img, idx) => (
              <div key={idx} className="relative">
                <img
                  src={img}
                  alt={`upload-${idx}`}
                  className="w-20 h-20 rounded-xl object-cover border border-surface-container"
                />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Image Upload Button */}
        {images.length < MAX_IMAGES && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-sm text-primary font-medium mb-6 hover:underline"
          >
            <ImageIcon size={18} />
            添加图片（{images.length}/{MAX_IMAGES}）
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageSelect}
        />

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="w-full py-3 soul-gradient text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          发布问题
        </button>
      </div>
    </div>
  );
}

/* ==================== Contributor ==================== */

function Contributor({
  name,
  role,
  points,
  avatar,
}: {
  name: string;
  role: string;
  points: number;
  avatar: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img
          src={avatar}
          alt={name}
          className="w-10 h-10 rounded-full"
          referrerPolicy="no-referrer"
        />
        <div>
          <div className="text-sm font-bold">{name}</div>
          <div className="text-[10px] text-on-surface-variant">{role}</div>
        </div>
      </div>
      <div className="text-xs font-bold text-primary">{points} pts</div>
    </div>
  );
}
