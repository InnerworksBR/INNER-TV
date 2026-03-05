"use client";

import { useEffect, useState } from "react";
import { PlayCircle, Plus, Edit2, ListOrdered, Clock, Tv, X, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Playlists() {
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState("");

    useEffect(() => {
        fetchPlaylists();
    }, []);

    async function fetchPlaylists() {
        const { data } = await supabase
            .from('playlists')
            .select('*, playlist_items(id), tvs(id)');

        if (data) setPlaylists(data);
        setLoading(false);
    }

    async function handleCreate() {
        if (!newName) return;
        const { error } = await supabase
            .from('playlists')
            .insert([{ name: newName }]);

        if (!error) {
            setNewName("");
            setShowCreate(false);
            fetchPlaylists();
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2 gradient-text">Playlists</h2>
                    <p className="text-zinc-400">Crie e organize sequências de reprodução para suas mídias.</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Nova Playlist
                </button>
            </header>

            {/* Playlists Grid */}
            {loading ? (
                <div className="p-20 text-center text-zinc-500">Carregando playlists...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {showCreate && (
                        <div className="glass rounded-2xl p-6 border-2 border-blue-600/30 bg-blue-600/5 animate-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-white">Nova Playlist</h4>
                                <button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-white"><X size={18} /></button>
                            </div>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Ex: Avisos de Segurança"
                                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm mb-4 focus:ring-2 focus:ring-blue-600 outline-none"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                            <button
                                onClick={handleCreate}
                                className="w-full py-2 bg-blue-600 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2"
                            >
                                <Check size={16} /> Confirmar
                            </button>
                        </div>
                    )}

                    {playlists.map((playlist) => (
                        <div key={playlist.id} className="glass rounded-2xl p-6 group hover:border-white/20 transition-all border border-white/5 relative bg-zinc-900/40">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center">
                                    <PlayCircle className="text-blue-500 w-6 h-6 shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
                                </div>
                                <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>

                            <h4 className="text-lg font-bold text-white mb-4 truncate">{playlist.name}</h4>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 text-zinc-500 font-medium italic">
                                        <ListOrdered className="w-3.5 h-3.5" />
                                        <span>Mídias</span>
                                    </div>
                                    <span className="text-zinc-300 font-bold">{playlist.playlist_items?.length || 0}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 text-zinc-500 font-medium italic">
                                        <Tv className="w-3.5 h-3.5" />
                                        <span>TVs exibindo</span>
                                    </div>
                                    <span className="text-zinc-300 font-bold">{playlist.tvs?.length || 0}</span>
                                </div>
                            </div>

                            <Link
                                href={`/playlists/${playlist.id}`}
                                className="w-full inline-flex items-center justify-center py-2.5 bg-zinc-900 hover:bg-black border border-zinc-800 rounded-xl text-[10px] font-bold text-zinc-400 hover:text-blue-400 uppercase tracking-widest transition-all"
                            >
                                Configurar Sequência
                            </Link>
                        </div>
                    ))}

                    {!showCreate && (
                        <button
                            onClick={() => setShowCreate(true)}
                            className="border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-8 hover:border-blue-600/50 hover:bg-blue-600/5 transition-all group min-h-[220px]"
                        >
                            <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Plus className="text-zinc-500 group-hover:text-blue-500 w-6 h-6" />
                            </div>
                            <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] group-hover:text-zinc-300">Criar Nova Playlist</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
