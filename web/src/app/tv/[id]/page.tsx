"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, Tv } from "lucide-react";

export default function TvSimulatorPage() {
    const { id } = useParams();
    const [playlist, setPlaylist] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!id) return;

        fetchPlaylist();

        // Subscribe to TV changes (heartbeat and playlist updates)
        const channel = supabase
            .channel(`tv-${id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'tvs',
                filter: `id=eq.${id}`
            }, () => {
                fetchPlaylist();
            })
            .subscribe();

        // Heartbeat simulator
        const hbInterval = setInterval(() => {
            supabase.from('tvs').update({
                last_heartbeat: new Date().toISOString(),
                status: 'online'
            }).eq('id', id);
        }, 30000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(hbInterval);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [id]);

    async function fetchPlaylist() {
        const { data: tv } = await supabase
            .from('tvs')
            .select('playlist_id')
            .eq('id', id)
            .single();

        if (tv?.playlist_id) {
            const { data: items } = await supabase
                .from('playlist_items')
                .select('sort_order, media(url, type, duration_seconds)')
                .eq('playlist_id', tv.playlist_id)
                .order('sort_order');

            if (items) {
                setPlaylist(items);
                setLoading(false);
            }
        } else {
            setPlaylist([]);
            setLoading(false);
        }
    }

    useEffect(() => {
        if (playlist.length === 0) return;

        const currentMedia = playlist[currentIndex].media;

        if (currentMedia.type === 'image') {
            const duration = (currentMedia.duration_seconds || 10) * 1000;
            timerRef.current = setTimeout(next, duration);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [currentIndex, playlist]);

    function next() {
        setCurrentIndex((prev) => (prev + 1) % playlist.length);
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (playlist.length === 0) {
        return (
            <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-zinc-500 gap-4">
                <Tv className="w-20 h-20" />
                <p className="text-xl font-medium">Nenhuma playlist atribuída a esta TV</p>
                <p className="text-sm opacity-50 font-mono">{id}</p>
            </div>
        );
    }

    const current = playlist[currentIndex].media;

    return (
        <div className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center">
            {current.type === 'video' ? (
                <video
                    ref={videoRef}
                    src={current.url}
                    autoPlay
                    muted
                    onEnded={next}
                    className="w-full h-full object-contain"
                />
            ) : (
                <img
                    src={current.url}
                    alt="TV Content"
                    className="w-full h-full object-contain animate-in fade-in duration-1000"
                />
            )}

            {/* Status Overlay (Subtle) */}
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full border border-white/10 opacity-0 hover:opacity-100 transition-opacity">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Simulator Online</span>
            </div>
        </div>
    );
}
