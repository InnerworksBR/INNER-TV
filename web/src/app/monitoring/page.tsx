import { Activity, Server, Database, Globe, RefreshCcw } from "lucide-react";

const services = [
    { name: "API REST", status: "ok", latency: "24ms", icon: Globe },
    { name: "Banco de Dados", status: "ok", latency: "12ms", icon: Database },
    { name: "Realtime Socket", status: "ok", latency: "45ms", icon: RefreshCcw },
    { name: "Storage Service", status: "ok", latency: "110ms", icon: Server },
];

export default function Monitoring() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-10">
                <h2 className="text-3xl font-bold tracking-tight mb-2">Monitoramento de Sistema</h2>
                <p className="text-zinc-400">Status técnico da infraestrutura e serviços do backend.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {services.map((service) => (
                    <div key={service.name} className="glass p-6 rounded-2xl flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-zinc-900 border border-zinc-800`}>
                            <service.icon className="w-6 h-6 text-zinc-400" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-zinc-400 mb-1">{service.name}</div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                                <span className="text-lg font-bold text-white uppercase tracking-tight">{service.status}</span>
                                <span className="text-xs text-zinc-600 ml-1">{service.latency}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                    <Activity className="text-blue-500 w-5 h-5" />
                    <h3 className="font-bold text-lg text-white">Logs em Tempo Real</h3>
                </div>

                <div className="bg-black/50 rounded-xl p-6 font-mono text-xs text-zinc-500 space-y-2 border border-zinc-800 h-96 overflow-y-auto">
                    <div><span className="text-zinc-700">[14:25:01]</span> <span className="text-blue-500">INFO</span> TV &quot;Recepção Central&quot; enviou heartbeat com sucesso.</div>
                    <div><span className="text-zinc-700">[14:24:58]</span> <span className="text-blue-500">INFO</span> API: GET /rest/v1/playlists - 200 OK</div>
                    <div><span className="text-zinc-700">[14:24:30]</span> <span className="text-green-500">SYNC</span> Playlist &quot;Cardápio Semanal&quot; sincronizada em 2 dispositivos.</div>
                    <div><span className="text-zinc-700">[14:23:15]</span> <span className="text-amber-500">WARN</span> TV &quot;RH - Mural Digital&quot; está offline. Tentando reconectar...</div>
                    <div><span className="text-zinc-700">[14:20:00]</span> <span className="text-blue-500">INFO</span> Sistema operacional iniciado. Supabase Docker v2.45.0</div>
                    <div className="animate-pulse">_</div>
                </div>
            </div>
        </div>
    );
}
