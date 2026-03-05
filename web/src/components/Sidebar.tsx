"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Tv,
    PlayCircle,
    Image as ImageIcon,
    Settings,
    Activity
} from "lucide-react";

const menuItems = [
    { name: "Painel Principal", icon: LayoutDashboard, path: "/" },
    { name: "TVs Conectadas", icon: Tv, path: "/tvs" },
    { name: "Playlists", icon: PlayCircle, path: "/playlists" },
    { name: "Conteúdo", icon: ImageIcon, path: "/content" },
    { name: "Monitoramento", icon: Activity, path: "/monitoring" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 h-screen bg-black border-r border-zinc-800 flex flex-col p-6 fixed left-0 top-0">
            <div className="flex items-center gap-3 mb-10">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Tv className="text-white w-5 h-5" />
                </div>
                <h1 className="text-white font-bold text-xl tracking-tight">TV Corp</h1>
            </div>

            <nav className="flex-1 space-y-2">
                {menuItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? "bg-blue-600 text-white"
                                    : "text-zinc-400 hover:bg-zinc-900 hovet:text-zinc-100"
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="pt-6 border-t border-zinc-800">
                <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white transition-colors"
                >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Configurações</span>
                </Link>
            </div>
        </div>
    );
}
