import 'package:just_audio/just_audio.dart';

class RadioService {
  static final RadioService _instance = RadioService._internal();
  factory RadioService() => _instance;
  RadioService._internal();

  final AudioPlayer _player = AudioPlayer();
  String? _currentUrl;
  bool _isRadioActive = false;

  /// Inicia ou troca o stream de rádio.
  /// Se a URL for igual à atual e já estiver tocando, não faz nada.
  Future<void> play(String url) async {
    if (url.isEmpty) {
      await stop();
      return;
    }

    _isRadioActive = true;

    if (_currentUrl == url && _player.playing) return;

    try {
      _currentUrl = url;
      await _player.setUrl(url);
      _player.setVolume(1.0);
      await _player.play();
      print('[RadioService] Tocando rádio: $url');
    } catch (e) {
      print('[RadioService] Erro ao iniciar rádio: $e');
    }
  }

  /// Pausa temporariamente (ex: quando vídeo com som está tocando).
  Future<void> pause() async {
    if (_player.playing) {
      await _player.pause();
    }
  }

  /// Retoma a rádio após pausa (ex: após vídeo com som terminar).
  Future<void> resume() async {
    if (_isRadioActive && _currentUrl != null && !_player.playing) {
      try {
        await _player.play();
      } catch (e) {
        // Tenta reconectar se o stream caiu
        await play(_currentUrl!);
      }
    }
  }

  /// Para completamente e limpa a URL.
  Future<void> stop() async {
    _isRadioActive = false;
    _currentUrl = null;
    await _player.stop();
    print('[RadioService] Rádio parada.');
  }

  bool get isActive => _isRadioActive;
  bool get isPlaying => _player.playing;

  void dispose() {
    _player.dispose();
  }
}
