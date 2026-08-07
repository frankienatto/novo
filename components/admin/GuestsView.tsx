import React, { useState, useMemo } from 'react';
import { DBState, Guest, GuestPost, GuestPostComment } from '../../types';
import { Section } from './shared';
import { Users, UserPlus, Search, Edit, MessageSquare, Trash2, Loader2 } from 'lucide-react';

interface GuestsViewProps {
    db: DBState;
    onAddGuest: () => void;
    onEditGuest: (guest: Guest) => void;
    onDeleteGuestPost: (postId: string) => Promise<void>;
    onDeletePostComment: (postId: string, commentTimestamp: string) => Promise<void>;
}

import { ResetCategoryButton } from './ResetCategoryButton';

const GuestsView: React.FC<GuestsViewProps> = ({ db, onAddGuest, onEditGuest, onDeleteGuestPost, onDeletePostComment }) => {
    const [activeTab, setActiveTab] = useState<'list' | 'feed'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const filteredGuests = useMemo(() =>
        db.guests.filter(g => g.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || g.email.toLowerCase().includes(searchTerm.toLowerCase())),
        [db.guests, searchTerm]
    );

    const handleDeletePost = async (postId: string) => {
        if (confirm('Tem certeza que deseja excluir este post?')) {
            setDeletingId(postId);
            await onDeleteGuestPost(postId);
            setDeletingId(null);
        }
    };

    const handleDeleteComment = async (postId: string, commentTimestamp: string) => {
         if (confirm('Tem certeza que deseja excluir este comentário?')) {
            setDeletingId(`${postId}-${commentTimestamp}`);
            await onDeletePostComment(postId, commentTimestamp);
            setDeletingId(null);
        }
    };

    const GuestListTab = () => (
        <div className="space-y-4">
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                    <input
                        type="text"
                        placeholder="Buscar hóspede por nome ou email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="input-base pl-10"
                    />
                </div>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {filteredGuests.map(guest => (
                     <div key={guest.id} className="bg-gray-50 p-3 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center">
                        <div>
                            <p className="font-bold text-gray-800">{guest.fullName}</p>
                            <p className="text-sm text-gray-500">{guest.email}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <p className="text-sm text-gray-500 mt-1 sm:mt-0">{guest.phone}</p>
                            <button onClick={() => onEditGuest(guest)} className="text-blue-600 hover:text-blue-900">
                                <Edit size={16}/>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const CommunityFeedTab = () => (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {db.guestPosts.map(post => (
                <div key={post.id} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <img src={post.guestProfilePictureUrl || `https://i.pravatar.cc/150?u=${post.guestId}`} alt={post.guestName} className="w-10 h-10 rounded-full" />
                            <div>
                                <p className="font-semibold text-gray-800">{post.guestName}</p>
                                <p className="text-xs text-gray-500">{new Date(post.timestamp).toLocaleString()}</p>
                            </div>
                        </div>
                        <button onClick={() => handleDeletePost(post.id)} className="text-red-500 hover:text-red-700 p-1" disabled={deletingId === post.id}>
                            {deletingId === post.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                    </div>
                    <p className="my-3 text-sm text-gray-700">{post.text}</p>
                    {post.imageUrl && <img src={post.imageUrl} alt="Post content" className="rounded-lg max-h-48 w-auto mb-3" />}
                    
                    {post.comments.length > 0 && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                            <h4 className="text-xs font-bold text-gray-600">Comentários</h4>
                            {post.comments.map(comment => (
                                <div key={comment.timestamp} className="text-xs bg-white p-2 rounded-md flex justify-between items-start">
                                    <div>
                                        <strong>{comment.guestName}:</strong> {comment.text}
                                    </div>
                                    <button onClick={() => handleDeleteComment(post.id, comment.timestamp)} className="text-red-500 hover:text-red-700 p-1 flex-shrink-0" disabled={deletingId === `${post.id}-${comment.timestamp}`}>
                                        {deletingId === `${post.id}-${comment.timestamp}` ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );


    return (
        <Section title="Hóspedes" icon={Users} actions={
            <div className="flex gap-2">
                <ResetCategoryButton category="guests" />
                {activeTab === 'list' && (
                    <button onClick={onAddGuest} className="bg-brand-green text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-brand-green-dark flex items-center gap-2">
                        <UserPlus size={18} /> <span className="hidden sm:inline">Adicionar Hóspede</span>
                    </button>
                )}
            </div>
        }>
            <div className="flex border-b mb-6">
                <button onClick={() => setActiveTab('list')} className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold ${activeTab === 'list' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500'}`}><Users size={16}/> Lista de Hóspedes</button>
                <button onClick={() => setActiveTab('feed')} className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold ${activeTab === 'feed' ? 'border-b-2 border-brand-green text-brand-green' : 'text-gray-500'}`}><MessageSquare size={16}/> Mural da Comunidade</button>
            </div>
            {activeTab === 'list' ? <GuestListTab /> : <CommunityFeedTab />}
        </Section>
    );
};

export default GuestsView;