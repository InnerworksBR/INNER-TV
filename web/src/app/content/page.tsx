"use client";

import { useEffect, useState } from "react";
import { Upload, Image as ImageIcon, Video, Trash2, Search, Loader2, BarChart3, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Content() {
    const [media, setMedia] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isBIModalOpen, setIsBIModalOpen] = useState(false);
    const [biName, setBiName] = useState("");
    const [biUrl, setBiUrl] = useState("");

    useEffect(() => {
        fetchMedia();
    }, []);

    async function fetchMedia() {
        const { data } = await supabase
            .from('media')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setMedia(data);
        setLoading(false);
    }

    async function handleSavePowerBI() {
        if (!biName || !biUrl) return;
        setUploading(true);
        try {
            const { error } = await supabase
                .from('media')
                .insert([{
                    name: biName,
                    url: biUrl,
                    type: 'powerbi',
                    duration_seconds: 30
                }]);

            if (error) throw error;
            setIsBIModalOpen(false);
            setBiName("");
            setBiUrl("");
            fetchMedia();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setUploading(false);
        }
    }
    // ... existing handleUpload ...

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('media-content')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('media-content')
                .getPublicUrl(filePath);

            // 3. Save to Database
            const { error: dbError } = await supabase
                .from('media')
                .insert([{
                    name: file.name,
                    url: publicUrl,
                    type: file.type.startsWith('video') ? 'video' : 'image',
                    duration_seconds: 10
                }]);

            if (dbError) throw dbError;

            fetchMedia();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setUploading(false);
        }
    }

    async function deleteMedia(id: string, url: string) {
        if (!confirm("Tem certeza que deseja excluir esta mídia?")) return;

        try {
            const fileName = url.split('/').pop();
            if (fileName) {
                await supabase.storage.from('media-content').remove([fileName]);
            }
            await supabase.from('media').delete().eq('id', id);
            fetchMedia();
        } catch (error: any) {
            alert("Erro ao excluir mídia");
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2 gradient-text">Gerenciamento de Mídia</h2>
                    <p className="text-zinc-400">Envie e gerencie os vídeos e imagens que serão exibidos.</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setIsBIModalOpen(true)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all active:scale-95"
                    >
                        <BarChart3 className="w-4 h-4 text-purple-400" />
                        Adicionar Power BI
                    </button>

                    <label className={`cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-95 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? 'Enviando...' : 'Upload'}
                        <input type="file" className="hidden" onChange={handleUpload} accept="image/*,video/*" />
                    </label>
                </div>
            </header>

            {/* Power BI Modal */}
            {isBIModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass w-full max-w-md rounded-3xl border border-white/10 p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-purple-400" />
                                Integrar Power BI
                            </h3>
                            <button onClick={() => setIsBIModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5 ml-1">Nome do Relatório</label>
                                <input
                                    type="text"
                                    value={biName}
                                    onChange={(e) => setBiName(e.target.value)}
                                    placeholder="Ex: Dashboard de Vendas"
                                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5 ml-1">URL de Incorporação (Embed)</label>
                                <input
                                    type="text"
                                    value={biUrl}
                                    onChange={(e) => setBiUrl(e.target.value)}
                                    placeholder="https://app.powerbi.com/view?r=..."
                                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none transition-all"
                                />
                            </div>

                            <button
                                onClick={handleSavePowerBI}
                                disabled={!biName || !biUrl || uploading}
                                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Relatório'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Media Grid */}
            {loading ? (
                <div className="p-20 text-center text-zinc-500">Carregando galeria...</div>
            ) : media.length === 0 ? (
                <div className="p-20 text-center border-2 border-dashed border-zinc-800 rounded-3xl text-zinc-500">
                    Nenhuma mídia enviada. Comece fazendo um upload!
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {media.map((item) => (
                        <div key={item.id} className="glass rounded-2xl overflow-hidden group hover:border-white/20 transition-all border border-white/5">
                            <div className="aspect-video bg-zinc-900 flex items-center justify-center relative bg-gradient-to-br from-zinc-900 to-black">
                                {item.type === "image" ? (
                                    <ImageIcon className="w-12 h-12 text-zinc-800 group-hover:text-blue-500/20 transition-colors" />
                                ) : item.type === "video" ? (
                                    <Video className="w-12 h-12 text-zinc-800 group-hover:text-purple-500/20 transition-colors" />
                                ) : (
                                    <BarChart3 className="w-12 h-12 text-zinc-800 group-hover:text-purple-500/20 transition-colors" />
                                )}

                                {item.type === "image" && (
                                    <img src={item.url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                )}

                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => deleteMedia(item.id, item.url)}
                                        className="p-3 bg-red-500/20 hover:bg-red-500/40 rounded-full text-red-500 transition-colors backdrop-blur-sm"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="absolute top-3 right-3">
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${item.type === "image" ? "bg-amber-500/20 text-amber-500" :
                                            item.type === "video" ? "bg-blue-500/20 text-blue-500" :
                                                "bg-purple-500/20 text-purple-500"
                                        }`}>
                                        {item.type}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-zinc-900/50">
                                <h4 className="font-medium text-white truncate text-sm mb-1" title={item.name}>{item.name}</h4>
                                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono italic">
                                    <span>{item.duration_seconds}s</span>
                                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
