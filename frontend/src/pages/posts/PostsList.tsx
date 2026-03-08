import { useAppDispatch, useAppSelector } from '@/store'
import { fetchPosts } from '@/store/thunks/postsThunks'
import React, { useEffect } from 'react'

const PostsList: React.FC = () => {
	const dispatch = useAppDispatch()
	const { items, loading } = useAppSelector((s) => s.posts)

	useEffect(() => {
		dispatch(fetchPosts() as any)
	}, [dispatch])

	if (loading) return <div>Loading posts...</div>

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-semibold">Posts</h1>
			{items.length === 0 ? (
				<div className="text-sm text-gray-500">No posts found.</div>
			) : (
				<ul className="space-y-3">
					{items.map((p: any) => (
						<li key={p.id} className="p-3 bg-white rounded shadow-sm">
							<div className="text-sm text-gray-900">{p.content || p.text || p.title}</div>
							<div className="text-xs text-gray-500 mt-2">Likes: {p.likes_count || p.likes || 0}</div>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}

export default PostsList
