import React, { useEffect, useState } from 'react';
import { DocumentTextIcon, PencilIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { draftService, DraftPost } from '../../../services/draftService';
import ReactMarkdown from 'react-markdown';

export const PostsTab: React.FC = () => {
  const [posts, setPosts] = useState<DraftPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const result = await draftService.getDrafts(filter);
      if (result.success) {
        setPosts(result.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (postId: string) => {
    if (!confirm('Are you sure you want to publish this draft?')) return;

    try {
      const result = await draftService.publishDraft(postId);
      if (result.success) {
        alert('Draft published successfully!');
        fetchPosts(); // Refresh the list
      }
    } catch (error) {
      console.error('Error publishing draft:', error);
      alert('Failed to publish draft');
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const result = await draftService.deleteDraft(postId);
      if (result.success) {
        alert('Post deleted successfully!');
        fetchPosts(); // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const handleEdit = (post: DraftPost) => {
    // Navigate to dashboard with state to open editor
    // The header component will handle opening the editor modal
    window.dispatchEvent(new CustomEvent('openPostEditor', {
      detail: {
        postData: {
          content: post.content,
          media_files: post.media_files,
          id: post.id
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="text-gray-500">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Filter Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`pb-3 px-4 font-medium transition-colors ${filter === 'all'
            ? 'border-b-2 border-blue-600 text-blue-600'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          All Posts
        </button>
        <button
          onClick={() => setFilter('draft')}
          className={`pb-3 px-4 font-medium transition-colors ${filter === 'draft'
            ? 'border-b-2 border-blue-600 text-blue-600'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Drafts
        </button>
        <button
          onClick={() => setFilter('published')}
          className={`pb-3 px-4 font-medium transition-colors ${filter === 'published'
            ? 'border-b-2 border-blue-600 text-blue-600'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Published
        </button>
      </div>

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <DocumentTextIcon className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No {filter === 'all' ? '' : filter} posts yet
          </h3>
          <p className="text-gray-500 text-center max-w-md">
            {filter === 'draft'
              ? 'Save your posts as drafts to work on them later.'
              : filter === 'published'
                ? 'Published posts will appear here.'
                : 'Your posts will appear here once you create them.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${post.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                        }`}
                    >
                      {post.status === 'draft' ? '📝 Draft' : '✅ Published'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(post.updated_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Post Content */}
                  <div className="text-gray-900 mb-3 prose prose-sm max-w-none
                    prose-headings:font-bold prose-headings:text-gray-900
                    prose-p:text-gray-900 prose-p:leading-relaxed prose-p:text-[15px]
                    prose-strong:text-gray-900 prose-strong:font-bold
                    prose-ul:list-disc prose-ul:ml-5 prose-ul:text-gray-900
                    prose-li:text-gray-900 prose-li:text-[15px]
                    whitespace-pre-line break-words">
                    <ReactMarkdown>
                      {post.content.replace(/\[GIF: .+?\]/g, '')}
                    </ReactMarkdown>
                  </div>

                  {/* GIFs from content markers */}
                  {(() => {
                    const gifMatches = post.content.match(/\[GIF: (.+?)\]/g);
                    if (gifMatches && gifMatches.length > 0) {
                      const gifUrls = gifMatches.map((match: string) => {
                        const urlMatch = match.match(/\[GIF: (.+?)\]/);
                        return urlMatch ? urlMatch[1] : null;
                      }).filter(Boolean);

                      return (
                        <div className={`mb-3 ${gifUrls.length === 1 ? '' : 'grid grid-cols-2 gap-1'}`}>
                          {gifUrls.map((url, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={url as string}
                                alt="GIF"
                                className="w-full h-48 object-cover rounded"
                              />
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Media Display */}
                  {post.media_files && post.media_files.length > 0 && (
                    <div className={`mb-3 ${post.media_files.length === 1 ? '' : 'grid grid-cols-2 gap-1'}`}>
                      {post.media_files.map((file: any, index: number) => (
                        <div key={index} className="relative group">
                          {(file.type === 'image' || file.url?.endsWith('.gif') || file.url?.endsWith('.jpg') || file.url?.endsWith('.jpeg') || file.url?.endsWith('.png') || file.url?.endsWith('.webp')) ? (
                            <img
                              src={file.url}
                              alt={file.name || `Media ${index + 1}`}
                              className="w-full h-48 object-cover rounded"
                            />
                          ) : (file.type === 'video' || file.url?.endsWith('.mp4') || file.url?.endsWith('.webm')) ? (
                            <video
                              src={file.url}
                              controls
                              className="w-full h-48 object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded">
                              <div className="text-center text-gray-400">
                                <DocumentTextIcon className="w-12 h-12 mx-auto mb-2" />
                                <p className="text-xs">{file.name || 'File'}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 ml-4">
                  {/* Edit button - available for all posts */}
                  <button
                    onClick={() => handleEdit(post)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>

                  {/* Publish button - only for drafts */}
                  {post.status === 'draft' && (
                    <button
                      onClick={() => handlePublish(post.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Publish"
                    >
                      <CheckCircleIcon className="w-5 h-5" />
                    </button>
                  )}

                  {/* Delete button - available for all posts */}
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
