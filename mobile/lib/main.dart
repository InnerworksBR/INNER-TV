import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:video_player/video_player.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'screens/setup_screen.dart';
import 'services/supabase_service.dart';
import 'services/media_cache_service.dart';
import 'services/ticker_service.dart';
import 'services/radio_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  
  final prefs = await SharedPreferences.getInstance();
  final savedIp = prefs.getString('supabase_ip');
  final savedTvId = prefs.getString('tv_id');
  
  bool initialized = false;
  if (savedIp != null && savedTvId != null) {
    try {
      await Supabase.initialize(
        url: 'http://$savedIp:8000',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcyMjA5MDU5LCJleHAiOjIwODc1NjkwNTl9.qyhQsZ2rz5msSiFEdB--fJuZLealq6Soaoop6GA2jlg',
      );
      initialized = true;
    } catch (e) {
      print('Erro ao inicializar: $e');
    }
  }

  runApp(CorporateTVApp(startWithSetup: !initialized));
}

class CorporateTVApp extends StatelessWidget {
  final bool startWithSetup;
  const CorporateTVApp({super.key, required this.startWithSetup});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: Colors.black,
      ),
      home: startWithSetup ? const SetupScreen() : const TVPlayerScreen(),
    );
  }
}

class TVPlayerScreen extends StatefulWidget {
  const TVPlayerScreen({super.key});

  @override
  State<TVPlayerScreen> createState() => _TVPlayerScreenState();
}

class _TVPlayerScreenState extends State<TVPlayerScreen> {
  String _tvId = ''; 
  final SupabaseService _supabase = SupabaseService();
  final MediaCacheService _cache = MediaCacheService();
  final TickerService _ticker = TickerService();
  final RadioService _radio = RadioService();
  
  Map<String, dynamic>? _tvConfig;
  List<Map<String, dynamic>> _playlist = [];
  int _currentIndex = 0;
  VideoPlayerController? _videoController;
  Timer? _imageTimer;
  bool _isLoading = true;
  String _currentLocalPath = '';
  late final WebViewController _webController;

  @override
  void initState() {
    super.initState();
    _webController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.black);
    _loadTvId();
    _ticker.startFetching();
  }

  Future<void> _loadTvId() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _tvId = prefs.getString('tv_id') ?? '';
      
      if (_tvId.isNotEmpty) {
        await _initApp().timeout(const Duration(seconds: 15));
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        _showErrorAndRedirect('Falha na conexão.');
      }
    }
  }

  void _showErrorAndRedirect(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (context) => const SetupScreen()));
    });
  }

  Future<void> _initApp() async {
    await _fetchConfigurations();
    _startHeartbeat();
    _subscribeToChanges();
  }

  Future<void> _fetchConfigurations() async {
    final config = await _supabase.getTvConfig(_tvId);
    final items = await _supabase.getPlaylistForTv(_tvId);
    
    if (mounted) {
      if (config?['weather_city'] != null) {
        _ticker.setCity(config!['weather_city']);
      }

      // Atualiza rádio se a URL mudou
      final newRadioUrl = config?['radio_url'] as String? ?? '';
      final oldRadioUrl = _tvConfig?['radio_url'] as String? ?? '';
      if (newRadioUrl != oldRadioUrl) {
        if (newRadioUrl.isNotEmpty) {
          _radio.play(newRadioUrl);
        } else {
          _radio.stop();
        }
      }

      setState(() {
        _tvConfig = config;
        _playlist = items;
        _isLoading = false;
        if (items.isNotEmpty) _playCurrent();
      });

      // Inicia rádio na primeira carga
      if (newRadioUrl.isNotEmpty && !_radio.isActive) {
        _radio.play(newRadioUrl);
      }
    }
  }

  void _subscribeToChanges() {
    _supabase.subscribeToTvChanges(_tvId, () => _fetchConfigurations());
  }

  void _playCurrent() async {
    if (_playlist.isEmpty) return;
    
    final item = _playlist[_currentIndex];
    final mediaData = item['media'];
    final url = mediaData['url'];
    final type = mediaData['type'];
    final isMuted = item['is_muted'] ?? true;
    final duration = item['duration_seconds'] ?? mediaData['duration_seconds'] ?? 10;

    final localPath = await _cache.getLocalFilePath(url);
    if (!mounted) return;

    setState(() => _currentLocalPath = localPath);

    if (type == 'video') {
      _videoController?.dispose();
      
      bool useLocal = localPath.isNotEmpty && File(localPath).existsSync();
      print('Iniciando vídeo: ${useLocal ? "LOCAL" : "NETWORK"} - $url');
      
      if (useLocal) {
        _videoController = VideoPlayerController.file(File(localPath));
      } else {
        _videoController = VideoPlayerController.networkUrl(Uri.parse(url));
      }

      // Pausa rádio se o vídeo tem som próprio
      if (!isMuted) {
        await _radio.pause();
      } else {
        await _radio.resume();
      }

      try {
        await _videoController!.initialize();
        if (!mounted) return;
        
        _videoController!.setVolume(isMuted ? 0 : 1);
        _videoController!.play();
        setState(() {});
        
        _videoController!.addListener(() {
          if (_videoController!.value.hasError) {
            print('Erro no player de vídeo: ${_videoController!.value.errorDescription}');
            return;
          }
          if (_videoController!.value.position >= _videoController!.value.duration) {
            _videoController!.removeListener(() {});
             _next();
          }
        });
      } catch (e) {
        print('Erro ao inicializar vídeo: $e');
        _next(); // Pula para o próximo se este falhou
      }
    } else if (type == 'powerbi') {
      _videoController?.dispose();
      _videoController = null;
      _imageTimer?.cancel();
      
      print('Carregando Power BI: $url');
      _webController.loadRequest(Uri.parse(url));
      _imageTimer = Timer(Duration(seconds: duration), _next);
    } else {
      _videoController?.dispose();
      _videoController = null;
      _imageTimer?.cancel();
      // Imagens/outros tipos: rádio pode tocar
      await _radio.resume();
      _imageTimer = Timer(Duration(seconds: duration), _next);
    }
  }

  void _next() {
    if (_playlist.isEmpty) return;
    setState(() => _currentIndex = (_currentIndex + 1) % _playlist.length);
    _playCurrent();
  }

  void _startHeartbeat() {
    _supabase.sendHeartbeat(_tvId);
    Timer.periodic(const Duration(minutes: 2), (timer) => _supabase.sendHeartbeat(_tvId));
  }

  @override
  void dispose() {
    _videoController?.dispose();
    _imageTimer?.cancel();
    _ticker.stopFetching();
    _radio.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    return Scaffold(
      body: GestureDetector(
        onLongPress: () => Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (context) => const SetupScreen())),
        child: Stack(
          fit: StackFit.expand,
          children: [
            _buildPlayer(),
            if (_tvConfig?['show_bottom_bar'] == true) _buildBottomBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildPlayer() {
    if (_playlist.isEmpty) return const Center(child: Text('Nenhuma playlist'));
    final mediaData = _playlist[_currentIndex]['media'];

    if (mediaData['type'] == 'video' && _videoController?.value.isInitialized == true) {
      return Center(child: AspectRatio(aspectRatio: _videoController!.value.aspectRatio, child: VideoPlayer(_videoController!)));
    } else if (mediaData['type'] == 'powerbi') {
      return WebViewWidget(controller: _webController);
    } else if (mediaData['type'] == 'image') {
      return _currentLocalPath.isNotEmpty && File(_currentLocalPath).existsSync()
          ? Image.file(File(_currentLocalPath), fit: BoxFit.cover)
          : Image.network(mediaData['url'], fit: BoxFit.cover);
    }
    return const Center(child: CircularProgressIndicator());
  }

  Widget _buildBottomBar() {
    final color = Color(int.parse(_tvConfig?['bottom_bar_color']?.replaceAll('#', '0xff') ?? '0xff000000'));
    
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      height: 60,
      child: Container(
        color: color.withOpacity(0.9),
        child: Row(
          children: [
            if (_tvConfig?['logo_url'] != null && _tvConfig!['logo_url'].toString().isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                child: Image.network(
                  _tvConfig!['logo_url'], 
                  height: 40,
                  fit: BoxFit.contain,
                  errorBuilder: (ctx, err, stack) {
                    print('Erro ao carregar logo: $err');
                    return const SizedBox.shrink();
                  },
                ),
              ),
            Expanded(
              child: _TickerContent(
                showQuotes: _tvConfig?['show_quotes'] ?? true,
                showWeather: _tvConfig?['show_weather'] ?? true,
                ticker: _ticker,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TickerContent extends StatefulWidget {
  final bool showQuotes;
  final bool showWeather;
  final TickerService ticker;

  const _TickerContent({required this.showQuotes, required this.showWeather, required this.ticker});

  @override
  State<_TickerContent> createState() => _TickerContentState();
}

class _TickerContentState extends State<_TickerContent> {
  late ScrollController _scrollController;
  Timer? _scrollTimer;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    widget.ticker.addListener(_onTickerUpdate);
    WidgetsBinding.instance.addPostFrameCallback((_) => _startScrolling());
  }

  void _onTickerUpdate() {
    if (mounted) setState(() {});
  }

  void _startScrolling() {
    _scrollTimer = Timer.periodic(const Duration(milliseconds: 50), (timer) {
      if (_scrollController.hasClients) {
        _scrollController.jumpTo(_scrollController.offset + 1);
        if (_scrollController.offset >= _scrollController.position.maxScrollExtent) {
          _scrollController.jumpTo(0);
        }
      }
    });
  }

  @override
  void dispose() {
    widget.ticker.removeListener(_onTickerUpdate);
    _scrollTimer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      controller: _scrollController,
      scrollDirection: Axis.horizontal,
      children: [
        if (widget.showQuotes) ...widget.ticker.quotes.map((q) => _buildQuoteItem(q)),
        if (widget.showWeather) 
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Center(child: Text(widget.ticker.weather, style: const TextStyle(fontWeight: FontWeight.bold))),
          ),
        const SizedBox(width: 500), // Filler for loop
      ],
    );
  }

  Widget _buildQuoteItem(TickerData q) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Center(
        child: Row(
          children: [
            Text('${q.label}: ', style: const TextStyle(color: Colors.white70, fontSize: 12)),
            Text(q.value, style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(width: 4),
            Icon(q.isUp ? Icons.arrow_upward : Icons.arrow_downward, color: q.isUp ? Colors.green : Colors.red, size: 14),
          ],
        ),
      ),
    );
  }
}
