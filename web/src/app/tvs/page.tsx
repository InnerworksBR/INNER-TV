"use client";

import { useEffect, useState } from "react";
import { Tv, Activity, PlayCircle, Clock, Settings2, Trash2, Plus, Wifi, Check, X, Radio } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function TvsPage() {
    const [tvs, setTvs] = useState<any[]>([]);
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTv, setEditingTv] = useState<string | null>(null);

    useEffect(() => {
        fetchData();

        const channel = supabase
            .channel('tv-monitor')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tvs' }, () => fetchData())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    async function fetchData() {
        const [tRes, pRes] = await Promise.all([
            supabase.from('tvs').select('*, playlists(name)'),
            supabase.from('playlists').select('id, name')
        ]);

        if (tRes.data) setTvs(tRes.data);
        if (pRes.data) setPlaylists(pRes.data);
        setLoading(false);
    }

    async function registerTv() {
        const name = prompt("Nome da nova TV:");
        if (!name) return;

        // Gerar código de pareamento aleatório (6 caracteres)
        const pairingCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const { error } = await supabase
            .from('tvs')
            .insert([{ name, status: 'offline', pairing_code: pairingCode }]);

        if (error) {
            alert("Erro ao registrar TV: " + error.message);
        } else {
            alert(`TV Registrada! Use o código: ${pairingCode} no terminal.`);
        }

        fetchData();
    }

    async function updateTvSettings(tvId: string, settings: any) {
        await supabase
            .from('tvs')
            .update(settings)
            .eq('id', tvId);

        fetchData();
    }

    async function assignPlaylist(tvId: string, settings: any) {
        await updateTvSettings(tvId, settings);
        setEditingTv(null);
    }

    async function deleteTv(id: string) {
        if (!confirm("Excluir este terminal?")) return;
        await supabase.from('tvs').delete().eq('id', id);
        fetchData();
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2 gradient-text">TVs Conectadas</h2>
                    <p className="text-zinc-400">Gerencie e monitore o estado de cada terminal na rede.</p>
                </div>
                <button
                    onClick={registerTv}
                    className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Registrar Terminal
                </button>
            </header>

            {loading ? (
                <div className="p-20 text-center text-zinc-500">Escaneando terminais...</div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {tvs.map((tv) => (
                        <div key={tv.id} className="glass rounded-2xl overflow-hidden flex flex-col group transition-all hover:border-white/10 border border-white/5 bg-zinc-900/40">
                            <div className="p-6 flex items-start gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${tv.status === "online" ? "bg-green-600/10" : "bg-red-600/10"}`}>
                                    <Tv className={`w-7 h-7 ${tv.status === "online" ? "text-green-500" : "text-red-500"}`} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-lg font-bold text-white truncate">{tv.name}</h4>
                                        <div className={`w-2 h-2 rounded-full ${tv.status === "online" ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-red-500"}`} />
                                    </div>
                                    <p className="text-[10px] text-zinc-500 font-mono tracking-widest truncate">{tv.id}</p>
                                    <div className="mt-2 text-[10px] font-bold text-blue-400 font-mono">
                                        PAIRING CODE: {tv.pairing_code || '---'}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <a
                                        href={`/tv/${tv.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2.5 bg-zinc-800/50 border border-white/5 rounded-xl text-zinc-400 hover:text-blue-400 hover:border-blue-400/30 transition-all active:scale-95"
                                        title="Simular TV"
                                    >
                                        <Activity className="w-5 h-5" />
                                    </a>
                                    <button
                                        onClick={() => setEditingTv(editingTv === tv.id ? null : tv.id)}
                                        className={`p-2.5 border border-white/5 rounded-xl transition-colors ${editingTv === tv.id ? 'bg-blue-600 text-white' : 'bg-zinc-800/50 text-zinc-400 hover:text-white'}`}
                                    >
                                        <Settings2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {editingTv === tv.id ? (
                                <div className="px-6 py-8 bg-zinc-950/50 border-t border-blue-600/30 animate-in fade-in zoom-in-95 duration-200 space-y-8">
                                    <div className="flex justify-between items-center">
                                        <h5 className="text-sm font-bold text-white flex items-center gap-2">
                                            <Settings2 className="w-4 h-4 text-blue-500" />
                                            Ajustes do Terminal
                                        </h5>
                                        <button onClick={() => setEditingTv(null)} className="text-zinc-500 hover:text-white transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* LIVE PREVIEW AREA */}
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Live Preview (Barra Inferior)</label>
                                        <div
                                            className="w-full h-14 rounded-xl flex items-center px-4 overflow-hidden relative shadow-2xl border border-white/5"
                                            style={{ backgroundColor: (tv.show_bottom_bar ?? true) ? (tv.bottom_bar_color || "#000000") : "#121212" }}
                                        >
                                            {(tv.show_bottom_bar ?? true) ? (
                                                <>
                                                    {tv.logo_url && <img src={tv.logo_url} className="h-7 mr-6 object-contain" alt="Preview Logo" />}
                                                    <div className="flex-1 flex gap-8 text-[11px] font-bold text-white/90 whitespace-nowrap overflow-hidden italic">
                                                        {tv.show_quotes && (
                                                            <div className="flex gap-4 items-center">
                                                                <span className="flex items-center gap-1">USD R$ 5,24 <Check className="w-3 h-3 text-green-500" /></span>
                                                                <span className="flex items-center gap-1 text-zinc-400">|</span>
                                                                <span className="flex items-center gap-1">BTC R$ 420.500 <Check className="w-3 h-3 text-green-500" /></span>
                                                            </div>
                                                        )}
                                                        {tv.show_weather && (
                                                            <div className="flex gap-2 items-center text-blue-400">
                                                                <span>SÃO PAULO: 26°C 🌥️</span>
                                                            </div>
                                                        )}
                                                        {!tv.show_quotes && !tv.show_weather && <span className="text-zinc-600">Conteúdo da barra não configurado</span>}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Barra Oculta neste Terminal</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
                                        {/* Configuration Controls */}
                                        <div className="space-y-6">
                                            <div>
                                                <label className="text-[10px] font-bold text-zinc-400 uppercase mb-3 block">Playlist Ativa</label>
                                                <select
                                                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all"
                                                    defaultValue={tv.playlist_id || ""}
                                                    onChange={(e) => updateTvSettings(tv.id, { playlist_id: e.target.value || null })}
                                                >
                                                    <option value="">Nenhuma</option>
                                                    {playlists.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="p-4 bg-zinc-900/40 rounded-xl border border-white/5 space-y-4">
                                                <label className="text-[10px] font-bold text-blue-400 uppercase block tracking-wider">Visibilidade e Cor</label>
                                                <div className="flex items-center justify-between">
                                                    <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={tv.show_bottom_bar ?? true}
                                                            onChange={(e) => updateTvSettings(tv.id, { show_bottom_bar: e.target.checked })}
                                                            className="w-5 h-5 rounded-lg border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-0"
                                                        />
                                                        Exibir Barra Inferior
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-zinc-500 font-bold uppercase">Cor:</span>
                                                        <input
                                                            type="color"
                                                            value={tv.bottom_bar_color || "#000000"}
                                                            onChange={(e) => updateTvSettings(tv.id, { bottom_bar_color: e.target.value })}
                                                            className="w-10 h-10 rounded-xl border-2 border-white/10 bg-transparent cursor-pointer p-0 overflow-hidden"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="p-4 bg-zinc-900/40 rounded-xl border border-white/5 space-y-4">
                                                <label className="text-[10px] font-bold text-blue-400 uppercase block tracking-wider">Widgets do Ticker</label>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer p-2 hover:bg-white/5 rounded-lg transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={tv.show_quotes ?? true}
                                                            onChange={(e) => updateTvSettings(tv.id, { show_quotes: e.target.checked })}
                                                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-600"
                                                        />
                                                        Cotações
                                                    </label>
                                                    <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer p-2 hover:bg-white/5 rounded-lg transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={tv.show_weather ?? true}
                                                            onChange={(e) => updateTvSettings(tv.id, { show_weather: e.target.checked })}
                                                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-600"
                                                        />
                                                        Clima
                                                    </label>
                                                </div>
                                                {tv.show_weather && (
                                                    <div className="mt-4 pt-4 border-t border-white/5">
                                                        <label className="text-[9px] font-bold text-zinc-500 uppercase block mb-2">Cidade da Previsão</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Ex: São Paulo, BR"
                                                            defaultValue={tv.weather_city || "São Paulo"}
                                                            onBlur={(e) => updateTvSettings(tv.id, { weather_city: e.target.value })}
                                                            className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none transition-all"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-zinc-400 uppercase mb-2 block">Logo da Empresa (URL)</label>
                                                <input
                                                    type="text"
                                                    placeholder="https://suaempresa.com/logo.png"
                                                    defaultValue={tv.logo_url || ""}
                                                    onBlur={(e) => updateTvSettings(tv.id, { logo_url: e.target.value })}
                                                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all placeholder:text-zinc-700"
                                                />
                                            </div>

                                            <div className="p-4 bg-zinc-900/40 rounded-xl border border-white/5 space-y-3">
                                                <label className="text-[10px] font-bold text-purple-400 uppercase block tracking-wider flex items-center gap-2">
                                                    <Radio className="w-3 h-3" /> Rádio Web
                                                </label>
                                                <p className="text-[10px] text-zinc-500">Cole a URL de um stream de rádio (MP3, AAC, HLS).</p>
                                                <div className="flex gap-2 items-center">
                                                    <input
                                                        key={tv.id + '-radio'}
                                                        type="text"
                                                        placeholder="https://radio.exemplo.com/stream.mp3"
                                                        defaultValue={tv.radio_url || ""}
                                                        onBlur={(e) => updateTvSettings(tv.id, { radio_url: e.target.value || null })}
                                                        className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none transition-all placeholder:text-zinc-700"
                                                    />
                                                    {tv.radio_url && (
                                                        <button
                                                            onClick={() => updateTvSettings(tv.id, { radio_url: null })}
                                                            title="Parar rádio"
                                                            className="p-2 rounded-lg bg-zinc-800 hover:bg-red-900/40 text-zinc-400 hover:text-red-400 transition-colors"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                                {tv.radio_url && (
                                                    <div className="flex items-center gap-2 text-[10px] text-purple-400">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                                        Rádio ativa neste terminal
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-center">
                                        <button
                                            onClick={() => setEditingTv(null)}
                                            className="px-10 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 uppercase tracking-widest"
                                        >
                                            Salvar e Sair
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="px-6 py-4 bg-black/40 border-t border-zinc-800/50 grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic">Playlist</span>
                                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                                            <PlayCircle className="w-4 h-4 text-blue-500" />
                                            {tv.playlists?.name || 'Não atribuída'}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic">Visto por último</span>
                                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-400 font-mono">
                                            <Clock className="w-4 h-4 text-zinc-600" />
                                            {tv.last_heartbeat ? new Date(tv.last_heartbeat).toLocaleTimeString() : 'Nunca'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="p-4 flex justify-between items-center text-[9px] text-zinc-600 font-bold tracking-tight uppercase">
                                <span className="flex items-center gap-1">
                                    <Wifi className="w-3 h-3" />
                                    NETWORK STATUS: STABLE
                                </span>
                                <button
                                    onClick={() => deleteTv(tv.id)}
                                    className="hover:text-red-500 cursor-pointer transition-colors flex items-center gap-1"
                                >
                                    <Trash2 className="w-3 h-3" /> EXCLUIR
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
