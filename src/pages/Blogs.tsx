import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { adminApi } from '../lib/api';
import type { Blog } from '../lib/api';
import { Plus, Pencil, Trash2, Loader2, Star, Search, ImageIcon, EyeOff } from 'lucide-react';

const FEATURED_LIMIT = 3;

export default function Blogs() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ['blogs'],
    queryFn: () => adminApi.getBlogs(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteBlog(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blogs'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Blog> }) => adminApi.updateBlog(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blogs'] }),
    onError: (err: Error) => alert(err.message),
  });

  const featuredCount = blogs.filter(b => b.isFeatured).length;

  const handleToggleFeatured = (blog: Blog) => {
    if (!blog.isFeatured && featuredCount >= FEATURED_LIMIT) {
      alert(`You can feature at most ${FEATURED_LIMIT} articles. Un-feature one first.`);
      return;
    }
    updateMutation.mutate({ id: blog._id, data: { isFeatured: !blog.isFeatured } });
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this article? This cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const filtered = blogs.filter(b =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Legal News</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage articles. Up to {FEATURED_LIMIT} can be featured on the home page.
          </p>
        </div>
        <button
          onClick={() => navigate('/blogs/new')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Article
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? 'No articles match your search.' : 'No articles yet. Create your first one!'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filtered.map((blog) => (
              <div key={blog._id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="h-20 w-28 shrink-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                    {blog.image?.url ? (
                      <img src={blog.image.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-gray-900 truncate">{blog.title}</h3>
                      {blog.isFeatured && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full inline-flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          Featured
                        </span>
                      )}
                      {!blog.isPublished && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full inline-flex items-center gap-1">
                          <EyeOff className="h-3 w-3" />
                          Draft
                        </span>
                      )}
                    </div>
                    {blog.excerpt && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{blog.excerpt}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {blog.sections.length} block{blog.sections.length === 1 ? '' : 's'}
                      {blog.createdAt && ` · ${new Date(blog.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleFeatured(blog)}
                      className={`p-2 rounded-lg transition-colors ${
                        blog.isFeatured
                          ? 'text-amber-500 hover:bg-amber-50'
                          : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                      }`}
                      title={blog.isFeatured ? 'Un-feature' : 'Feature on home page'}
                    >
                      <Star className={`h-5 w-5 ${blog.isFeatured ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => navigate(`/blogs/${blog._id}/edit`)}
                      className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(blog._id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
