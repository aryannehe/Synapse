"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { serviceLayer } from "@/services/serviceLayer";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { 
  Search, 
  Filter, 
  BookMarked, 
  Eye, 
  Calendar, 
  ArrowUpDown, 
  Sparkles, 
  FileText, 
  X,
  Tag,
  ArrowRight,
  TrendingUp,
  Bookmark,
  PlusCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import { cn } from "@/lib/utils";
import { mockDocuments } from "@/services/mockData";

export default function KnowledgePage() {
  const { 
    recentSearches, 
    addRecentSearch, 
    clearRecentSearches, 
    bookmarkedDocIds, 
    toggleBookmark 
  } = useWorkspaceStore();
  
  const user = useWorkspaceStore((state) => state.user);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSort, setSelectedSort] = useState("Newest");
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Article creation states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("HR");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newIsPublic, setNewIsPublic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch search results using React Query
  const { data: searchResults, isLoading, isError, refetch } = useQuery({
    queryKey: ["knowledgeSearch", activeSearch, selectedCategory, selectedSort],
    queryFn: () => serviceLayer.searchArticles(activeSearch, selectedCategory, selectedSort),
  });

  const categories = ["All", "HR", "Engineering", "Finance", "Legal", "Marketing"];
  const sortOptions = ["Newest", "Oldest", "Most Viewed"];

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveSearch(searchQuery);
    addRecentSearch(searchQuery);
    setIsAutocompleteOpen(false);
  };

  const handleRecentClick = (term: string) => {
    setSearchQuery(term);
    setActiveSearch(term);
    addRecentSearch(term);
    setIsAutocompleteOpen(false);
  };

  const selectedDocument = searchResults?.documents.find(d => d.id === selectedDocId);

  return (
    <div className="space-y-6 relative">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">Intelligent Knowledge Search</h2>
          <p className="text-sm text-slate-400 mt-1">
            Search policy docs, technical guidelines, and HR manuals naturally. Powered by Synapse Semantic LLM.
          </p>
        </div>
        {user?.role === "admin" && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs text-white font-bold inline-flex items-center gap-1.5 transition-all shadow-lg hover:shadow-indigo-650/15 cursor-pointer shrink-0 animate-none"
          >
            <PlusCircle className="h-4.5 w-4.5" /> New Document
          </button>
        )}
      </div>

      {/* 1. Search Bar with Autocomplete */}
      <div className="relative">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 relative">
          <div className="relative flex-1 rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsAutocompleteOpen(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-white placeholder-slate-400 text-sm transition-all focus:outline-none"
              placeholder='Type a natural question (e.g. "How does travel reimbursement work?")'
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-1.5 transition-colors shrink-0 shadow-md shadow-indigo-600/10"
          >
            <Sparkles className="h-4 w-4" /> Ask AI
          </button>
        </form>

        {/* Autocomplete Dropdown */}
        {isAutocompleteOpen && recentSearches.length > 0 && (
          <div className="absolute left-0 right-0 mt-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-40 p-2 max-w-lg">
            <div className="flex justify-between items-center px-3 py-1.5 border-b border-slate-800/80 mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent Searches</span>
              <button 
                onClick={clearRecentSearches}
                className="text-[9px] font-bold text-slate-500 hover:text-rose-400 transition-colors"
              >
                Clear History
              </button>
            </div>
            <div className="space-y-0.5">
              {recentSearches.map((term, i) => (
                <button
                  key={i}
                  onClick={() => handleRecentClick(term)}
                  className="w-full text-left px-3 py-2 text-xs text-slate-350 hover:bg-slate-850 hover:text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Search className="h-3.5 w-3.5 text-slate-500" />
                  <span>{term}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Filters & Sort Row */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                selectedCategory === cat
                  ? "bg-indigo-600/10 border-indigo-500/35 text-indigo-400 shadow-sm"
                  : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg py-1 px-2.5 focus:outline-none focus:border-indigo-500 transition-all font-semibold"
          >
            {sortOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Results & AI Answer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content Area: Results list */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Loading Skeleton */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-36 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : isError || !searchResults ? (
            <div className="text-center py-8">
              <p className="text-rose-400 font-bold">Query request timed out.</p>
              <p className="text-xs text-slate-500 mt-1">Please try again shortly.</p>
            </div>
          ) : searchResults.documents.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl border border-slate-850 text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-slate-500">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">No documents found matching criteria</p>
                <p className="text-xs text-slate-400 mt-1">Try refining search parameters or clearing category filters.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.documents.map((doc, idx) => {
                const bookmarked = bookmarkedDocIds.includes(doc.id);
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="glass-panel p-5 rounded-2xl border border-slate-850 hover:border-slate-800/80 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md"
                  >
                    <div>
                      {/* Document Meta Row */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold font-mono rounded">
                            {doc.category}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                            <Calendar className="h-3 w-3" />
                            <span>{doc.date}</span>
                          </div>
                        </div>

                        {/* Favorite button */}
                        <button
                          onClick={() => toggleBookmark(doc.id)}
                          className={cn(
                            "p-1.5 rounded-lg border transition-all cursor-pointer",
                            bookmarked 
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                              : "bg-slate-950/40 border-slate-850 hover:bg-slate-800 text-slate-500"
                          )}
                        >
                          <Bookmark className={cn("h-4 w-4", bookmarked ? "fill-amber-400" : "")} />
                        </button>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors line-clamp-1 mb-2">
                        {doc.title}
                      </h3>

                      {/* Snippet */}
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                        {doc.content.replace(/#+ /g, "").replace(/\*\*/g, "").slice(0, 160)}...
                      </p>
                    </div>

                    {/* Footer Row */}
                    <div className="flex justify-between items-center pt-3 border-t border-slate-800/40">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 max-w-[70%]">
                        {doc.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[8px] font-mono text-slate-500 bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Tag className="h-2 w-2" /> {tag}
                          </span>
                        ))}
                      </div>

                      {/* Open Action */}
                      <button
                        onClick={() => setSelectedDocId(doc.id)}
                        className="text-[10px] font-bold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        Read File <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

        </div>

        {/* Sidebar Panel: AI Answer Card */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="h-64 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
          ) : searchResults?.aiAnswer ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-indigo-950/40 to-slate-950/60 border border-indigo-900/30 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden"
            >
              {/* Background gradient blob */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />

              <div className="flex items-center justify-between pb-3 border-b border-indigo-900/20">
                <div className="flex items-center gap-1.5 text-indigo-400">
                  <Sparkles className="h-4.5 w-4.5 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider">AI Synthesized Answer</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded font-semibold font-mono">
                  {Math.round(searchResults.aiAnswer.confidence * 100)}% Confidence
                </span>
              </div>

              {/* Synthetic Answer text */}
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {searchResults.aiAnswer.answer}
              </p>

              {/* Source Annotation Documents */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Reference Sources</span>
                <div className="space-y-1">
                  {searchResults.aiAnswer.sources.map((srcName, idx) => {
                    const matchDoc = mockDocuments.find(d => d.title === srcName);
                    return (
                      <button
                        key={idx}
                        onClick={() => matchDoc && setSelectedDocId(matchDoc.id)}
                        className="w-full text-left p-2 bg-slate-900/60 border border-slate-850 hover:border-slate-800 rounded-lg flex items-center gap-2 text-[10px] font-semibold text-slate-200 transition-colors group"
                      >
                        <FileText className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate group-hover:text-indigo-300 flex-1">{srcName}</span>
                        <ArrowRight className="h-3 w-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Related Search Topics */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Related Inquiries</span>
                <div className="flex flex-wrap gap-1">
                  {searchResults.aiAnswer.relatedTopics.map((topic, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSearchQuery(topic);
                        setActiveSearch(topic);
                        addRecentSearch(topic);
                      }}
                      className="text-[9px] font-semibold text-slate-400 hover:text-indigo-400 bg-slate-900/60 border border-slate-850 px-2 py-1 rounded transition-colors"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

            </motion.div>
          ) : (
            <div className="glass-panel p-5 rounded-2xl border border-slate-850 text-center py-10 text-slate-500 space-y-2">
              <Sparkles className="h-6 w-6 text-slate-600 mx-auto" />
              <p className="text-xs">Type a query above to generate an AI synthesized answer card with documentation citations.</p>
            </div>
          )}
        </div>

      </div>

      {/* Slide-out Document Drawer Modal */}
      <AnimatePresence>
        {selectedDocId && selectedDocument && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDocId(null)}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-screen w-full sm:max-w-xl bg-slate-900 border-l border-slate-800 z-50 flex flex-col justify-between shadow-2xl p-6"
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-850 pb-4">
                <div className="space-y-1 max-w-[80%]">
                  <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono rounded">
                    {selectedDocument.category}
                  </span>
                  <h3 className="text-base font-bold text-white leading-snug line-clamp-2">
                    {selectedDocument.title}
                  </h3>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleBookmark(selectedDocument.id)}
                    className={cn(
                      "p-2 rounded-xl border transition-all cursor-pointer",
                      bookmarkedDocIds.includes(selectedDocument.id)
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        : "bg-slate-950/40 border-slate-850 hover:bg-slate-800 text-slate-500"
                    )}
                  >
                    <Bookmark className={cn("h-4.5 w-4.5", bookmarkedDocIds.includes(selectedDocument.id) ? "fill-amber-400" : "")} />
                  </button>
                  <button
                    onClick={() => setSelectedDocId(null)}
                    className="p-2 bg-slate-950/40 hover:bg-slate-800 border border-slate-850 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Content Markdown rendering */}
              <div className="flex-1 overflow-y-auto py-5 pr-1 text-slate-300 max-h-[82vh] prose prose-invert">
                <ReactMarkdown
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-lg font-bold text-white mt-4 mb-2 border-b border-slate-800 pb-1" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-sm font-bold text-slate-200 mt-4 mb-2" {...props} />,
                    p: ({node, ...props}) => <p className="text-xs leading-relaxed mb-3 text-slate-300" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-3 space-y-1 text-xs text-slate-350" {...props} />,
                    li: ({node, ...props}) => <li className="text-xs" {...props} />,
                  }}
                >
                  {selectedDocument.content}
                </ReactMarkdown>
              </div>

              {/* Footer info */}
              <div className="border-t border-slate-850 pt-4 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>Ref ID: {selectedDocument.id}</span>
                <div className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> <span>{selectedDocument.views} employee views</span>
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 4. Article Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Publish Guidelines Document</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-all"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newTitle.trim() || !newContent.trim()) return;
              setIsCreating(true);
              try {
                await axios.post("/api/knowledge", {
                  title: newTitle,
                  category: newCategory,
                  content: newContent,
                  tags: newTags.split(",").map(t => t.trim()).filter(Boolean),
                  isPublic: newIsPublic,
                });
                setNewTitle("");
                setNewContent("");
                setNewTags("");
                setNewIsPublic(false);
                setIsModalOpen(false);
                refetch();
              } catch (err) {
                console.error(err);
              } finally {
                setIsCreating(false);
              }
            }} className="p-6 space-y-4">
              
              {/* Title */}
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Document Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-850 text-slate-200 text-xs rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-650"
                  placeholder="e.g. Remote Work Infrastructure Reimbursement Standards"
                />
              </div>

              {/* Category & Visibility */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-850 text-slate-200 text-xs rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer animate-none"
                  >
                    <option value="HR">HR</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Finance">Finance</option>
                    <option value="Legal">Legal</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Client Visibility</label>
                  <div className="flex items-center h-[38px] pl-2">
                    <input
                      id="isPublic"
                      type="checkbox"
                      checked={newIsPublic}
                      onChange={(e) => setNewIsPublic(e.target.checked)}
                      className="h-4 w-4 bg-slate-955 border-slate-850 rounded text-indigo-650 focus:ring-indigo-500"
                    />
                    <label htmlFor="isPublic" className="ml-2 text-xs text-slate-400 cursor-pointer font-medium select-none">
                      Make Public to Clients
                    </label>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[10px] text-slate-505 font-bold uppercase tracking-wider mb-1.5">Tags (Comma Separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-850 text-slate-200 text-xs rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-650"
                  placeholder="e.g. remote-work, hardware, billing"
                />
              </div>

              {/* Content Markdown */}
              <div>
                <label className="block text-[10px] text-slate-505 font-bold uppercase tracking-wider mb-1.5">Markdown Content</label>
                <textarea
                  required
                  rows={6}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-850 text-slate-200 text-xs rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-650 resize-none font-mono text-[10px]"
                  placeholder="# Guidelines Summary..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newTitle.trim() || !newContent.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs text-white font-bold transition-all shadow-md hover:shadow-indigo-600/10"
                >
                  {isCreating ? "Publishing..." : "Publish Article"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
