import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  static final SupabaseService _instance = SupabaseService._internal();
  factory SupabaseService() => _instance;
  SupabaseService._internal();

  SupabaseClient get client => Supabase.instance.client;

  /// Busca as configurações da TV e sua playlist
  Future<Map<String, dynamic>?> getTvConfig(String tvId) async {
    try {
      final response = await client
          .from('tvs')
          .select('*, playlists(name)')
          .eq('id', tvId)
          .single()
          .timeout(const Duration(seconds: 10));
      return response;
    } catch (e) {
      print('Erro ao buscar config da TV: $e');
      return null;
    }
  }

  /// Busca a playlist atribuída a uma TV específica pelo ID
  Future<List<Map<String, dynamic>>> getPlaylistForTv(String tvId) async {
    try {
      final tvResponse = await client
          .from('tvs')
          .select('playlist_id')
          .eq('id', tvId)
          .single()
          .timeout(const Duration(seconds: 10));

      final playlistId = tvResponse['playlist_id'];
      if (playlistId == null) return [];

      final itemsResponse = await client
          .from('playlist_items')
          .select('sort_order, duration_seconds, is_muted, media(id, name, url, type, duration_seconds)')
          .eq('playlist_id', playlistId)
          .order('sort_order')
          .timeout(const Duration(seconds: 10));

      return List<Map<String, dynamic>>.from(itemsResponse);
    } catch (e) {
      print('Erro ao buscar playlist: $e');
      return [];
    }
  }

  /// Envia sinal de vida (heartbeat) da TV
  Future<void> sendHeartbeat(String tvId) async {
    try {
      await client.from('tvs').update({
        'last_heartbeat': DateTime.now().toIso8601String(),
        'status': 'online',
      }).eq('id', tvId)
      .timeout(const Duration(seconds: 10));
    } catch (e) {
      print('Erro ao enviar heartbeat: $e');
    }
  }

  /// Escuta mudanças em tempo real na playlist da TV
  void subscribeToTvChanges(String tvId, Function onUpdate) {
    try {
      client
          .from('tvs')
          .stream(primaryKey: ['id'])
          .eq('id', tvId)
          .listen((data) {
            if (data.isNotEmpty) {
              onUpdate();
            }
          });
    } catch (e) {
      print('Erro ao assinar mudanças: $e');
    }
  }
}
