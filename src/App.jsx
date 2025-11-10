import { useEffect, useMemo, useState } from 'react'

function Tag({ label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm border transition ${
        active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
      }`}
    >
      {label}
    </button>
  )
}

function App() {
  const baseUrl = useMemo(() => import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000', [])

  const [loading, setLoading] = useState(false)
  const [photos, setPhotos] = useState([])
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [tags, setTags] = useState('')
  const [featured, setFeatured] = useState(false)

  const [selectedTag, setSelectedTag] = useState('All')
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)
  const [query, setQuery] = useState('')

  const fetchPhotos = async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      if (showFeaturedOnly) params.set('featured', 'true')
      const res = await fetch(`${baseUrl}/api/photos?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load photos')
      const data = await res.json()
      setPhotos(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPhotos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFeaturedOnly])

  const allTags = useMemo(() => {
    const t = new Set()
    photos.forEach(p => (p.tags || []).forEach(tag => t.add(tag)))
    return ['All', ...Array.from(t)]
  }, [photos])

  const filtered = useMemo(() => {
    return photos.filter(p => {
      const tagMatch = selectedTag === 'All' || (p.tags || []).includes(selectedTag)
      const q = query.trim().toLowerCase()
      const qMatch = !q || p.title.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
      return tagMatch && qMatch
    })
  }, [photos, selectedTag, query])

  const handleAdd = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (!title || !imageUrl) throw new Error('Title and Image URL are required')
      const payload = {
        title,
        description: description || undefined,
        image_url: imageUrl,
        tags: tags
          .split(',')
          .map(t => t.trim())
          .filter(Boolean),
        featured,
      }
      const res = await fetch(`${baseUrl}/api/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to save photo')
      // reset form
      setTitle('')
      setDescription('')
      setImageUrl('')
      setTags('')
      setFeatured(false)
      await fetchPhotos()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 text-white grid place-items-center font-bold">P</div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Your Photo Gallery</h1>
              <p className="text-sm text-gray-500">Add images by URL and organize with tags</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search..."
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={showFeaturedOnly} onChange={e => setShowFeaturedOnly(e.target.checked)} />
              Featured only
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {allTags.map(t => (
              <Tag key={t} label={t} active={t === selectedTag} onClick={() => setSelectedTag(t)} />
            ))}
          </div>

          {loading ? (
            <div className="text-center text-gray-600">Loading photos...</div>
          ) : error ? (
            <div className="text-red-600 bg-red-50 border border-red-200 p-3 rounded">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-gray-600">No photos yet. Add your first one on the right!</div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <figure key={p.id} className="group bg-white rounded-xl overflow-hidden border hover:shadow-md transition">
                  <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                    <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  </div>
                  <figcaption className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-800 truncate" title={p.title}>{p.title}</h3>
                      {p.featured && <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">Featured</span>}
                    </div>
                    {p.description && <p className="text-sm text-gray-600 line-clamp-2">{p.description}</p>}
                    {p.tags && p.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.tags.map((t, i) => (
                          <span key={`${p.id}-tag-${i}`} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border">{t}</span>
                        ))}
                      </div>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </section>

        <aside className="lg:col-span-1">
          <div className="bg-white border rounded-xl p-5 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Add a Photo</h2>
            <p className="text-sm text-gray-500 mb-4">Paste an image URL, give it a title, and tag it.</p>

            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Title</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Sunset at the beach"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Image URL</label>
                <input
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://.../your-image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional details about this photo"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Tags (comma separated)</label>
                <input
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="travel, family, nature"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} />
                Mark as featured
              </label>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
              >
                Save Photo
              </button>

              <div className="text-xs text-gray-500">
                Backend: <span className="font-mono">{baseUrl}</span>
              </div>
            </form>
          </div>
        </aside>
      </main>

      <footer className="py-6 text-center text-sm text-gray-500">
        Built for you — add your photos, organize by tags, and spotlight your favorites.
      </footer>
    </div>
  )
}

export default App
