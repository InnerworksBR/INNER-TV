"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, ArrowLeft, GripVertical, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PlaylistDetails() {
    const { id } = useParams();
    const [playlist, setPlaylist] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [allMedia, setAllMedia] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    async function fetchData() {
        const [pRes, iRes, mRes] = await Promise.all([
            supabase.from('playlists').select('*').eq('id', id).single(),
            supabase.from('playlist_items').select('*, media(*)').eq('playlist_id', id).order('sort_order'),
            supabase.from('media').select('*')
        ]);

        setPlaylist(pRes.data);
        setItems(iRes.data || []);
        setAllMedia(mRes.data || []);
        setLoading(false);
    }

    async function addItem(mediaId: string) {
        const nextOrder = items.length;
        await supabase.from('playlist_items').insert([{
            playlist_id: id,
            media_id: mediaId,
            sort_order: nextOrder
        }]);
        fetchData();
    }

    async function removeItem(itemId: string) {
        await supabase.from('playlist_items').delete().eq('id', itemId);
        fetchData();
    }

    async function updateItem(itemId: string, data: any) {
        await supabase.from('playlist_items').update(data).eq('id', itemId);
        fetchData();
    }

    if (loading) return <div className="p-20 text-center text-zinc-500">Carregando detalhes...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <Link href="/playlists" className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition-colors group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Voltar para Playlists
            </Link>

            <header className="mb-10">
                <h2 className="text-3xl font-bold tracking-tight mb-2 gradient-text">{playlist?.name}</h2>
                <p className="text-zinc-400">Gerencie a ordem e o conteúdo desta sequência.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Current Items */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Itens da Playlist</h3>
                    {items.length === 0 ? (
                        <div className="p-10 border-2 border-dashed border-zinc-800 rounded-2xl text-center text-zinc-500">
                            Arraste ou adicione mídias da biblioteca.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={item.id} className="glass p-4 rounded-xl border border-white/5 flex items-center gap-4 bg-zinc-900/20 group">
                                    <span className="text-zinc-700 font-mono text-xs">{index + 1}</span>
                                    <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden">
                                        {item.media.type === 'image' && <img src={item.media.url} className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-white">{item.media.name}</h4>
                                        <span className="text-[10px] text-zinc-500 uppercase">{item.media.type} • original: {item.media.duration_seconds}s</span>
                                    </div>

                                    <div className="flex items-center gap-4 px-4 border-r border-white/5 h-12">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[9px] text-zinc-500 font-bold uppercase">Tempo (s)</label>
                                            <input
                                                type="number"
                                                defaultValue={item.duration_seconds || item.media.duration_seconds}
                                                onBlur={(e) => updateItem(item.id, { duration_seconds: parseInt(e.target.value) })}
                                                className="w-16 bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-white"
                                            />
                                        </div>

                                        {item.media.type === 'video' && (
                                            <div className="flex flex-col gap-1 items-center">
                                                <label className="text-[9px] text-zinc-500 font-bold uppercase">Som</label>
                                                <input
                                                    type="checkbox"
                                                    defaultChecked={!item.is_muted}
                                                    onChange={(e) => updateItem(item.id, { is_muted: !e.target.checked })}
                                                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="p-2 text-zinc-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Media Library */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Biblioteca de Mídia</h3>
                    <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                        <div className="p-4 border-b border-zinc-800/50 bg-zinc-900/40">
                            <p className="text-xs text-zinc-400">Clique para adicionar à playlist</p>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto divide-y divide-zinc-800/50">
                            {allMedia.map((m) => (
                                <div key={m.id} className="p-4 hover:bg-white/[0.02] flex items-center gap-3 transition-colors">
                                    <div className="w-10 h-10 rounded bg-zinc-800 overflow-hidden flex-shrink-0">
                                        {m.type === 'image' && <img src={m.url} className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-zinc-300 truncate">{m.name}</p>
                                    </div>
                                    <button
                                        onClick={() => addItem(m.id)}
                                        className="p-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-lg transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
