"use client";

import { useEffect, useState } from "react";
import { Tv, Activity, PlayCircle, Clock, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [tvs, setTvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    playlists: 0
  });

  useEffect(() => {
    fetchData();

    // Realtime subscription
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tvs' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchData() {
    const { data: tvsData } = await supabase
      .from('tvs')
      .select('*, playlists(name)');

    const { count: playlistCount } = await supabase
      .from('playlists')
      .select('*', { count: 'exact', head: true });

    if (tvsData) {
      setTvs(tvsData);
      setStats({
        total: tvsData.length,
        online: tvsData.filter(tv => tv.status === 'online').length,
        playlists: playlistCount || 0
      });
    }
    setLoading(false);
  }

  const statCards = [
    { name: "TVs Conectadas", value: stats.total.toString(), icon: Tv, detail: "Total cadastradas", color: "text-blue-500" },
    { name: "Online Agora", value: stats.online.toString(), icon: Activity, detail: `${stats.total - stats.online} offline`, color: "text-green-500" },
    { name: "Playlists Ativas", value: stats.playlists.toString(), icon: PlayCircle, detail: "Configuradas no sistema", color: "text-purple-500" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-10">
        <h2 className="text-3xl font-bold tracking-tight mb-2 gradient-text">Painel de Controle</h2>
        <p className="text-zinc-400">Bem-vindo ao centro de comando da sua TV Corporativa.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {statCards.map((stat) => (
          <div key={stat.name} className="glass p-6 rounded-2xl flex flex-col border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-zinc-400 font-medium">{stat.name}</span>
              <stat.icon className={`${stat.color} w-5 h-5`} />
            </div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <span className="text-xs text-zinc-500">{stat.detail}</span>
          </div>
        ))}
      </div>

      {/* TV List Table */}
      <div className="glass rounded-2xl overflow-hidden border border-white/5">
        <div className="p-6 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/20">
          <h3 className="font-semibold text-lg text-white">Status das TVs</h3>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Adicionar TV
          </button>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center text-zinc-500">Carregando dispositivos...</div>
          ) : tvs.length === 0 ? (
            <div className="p-20 text-center text-zinc-500">Nenhuma TV cadastrada ainda.</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-zinc-500 text-[11px] uppercase tracking-wider border-b border-zinc-800/50">
                  <th className="px-6 py-4 font-semibold italic">Nome da TV</th>
                  <th className="px-6 py-4 font-semibold italic">Playlist Atual</th>
                  <th className="px-6 py-4 font-semibold italic">Status</th>
                  <th className="px-6 py-4 font-semibold italic">Visto por último</th>
                  <th className="px-6 py-4 font-semibold italic text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {tvs.map((tv) => (
                  <tr key={tv.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 font-medium text-white">{tv.name}</td>
                    <td className="px-6 py-4 text-zinc-400 text-sm">
                      <div className="flex items-center gap-2">
                        <PlayCircle className="w-4 h-4 text-zinc-600" />
                        {tv.playlists?.name || 'Nenhuma'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${tv.status === "online" ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-red-500"}`} />
                        <span className={`text-sm ${tv.status === "online" ? "text-green-500" : "text-red-500"}`}>{tv.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 text-sm italic">
                      {tv.last_heartbeat ? new Date(tv.last_heartbeat).toLocaleTimeString() : 'Nunca'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">Gerenciar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
