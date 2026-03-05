import 'dart:io';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

class MediaCacheService {
  static final MediaCacheService _instance = MediaCacheService._internal();
  factory MediaCacheService() => _instance;
  MediaCacheService._internal();

  final Dio _dio = Dio();

  /// Obtém o caminho local do arquivo, baixando-o se não existir
  Future<String> getLocalFilePath(String url) async {
    try {
      final directory = await getApplicationDocumentsDirectory();
      final fileName = p.basename(Uri.parse(url).path);
      final cacheDir = Directory(p.join(directory.path, 'media_cache'));
      
      if (!await cacheDir.exists()) {
        await cacheDir.create(recursive: true);
      }

      final filePath = p.join(cacheDir.path, fileName);
      final file = File(filePath);
      
      if (await file.exists()) {
        return filePath;
      }

      // Baixa o arquivo se não existir
      await _dio.download(url, filePath);
      return filePath;
    } catch (e) {
      print('Erro ao fazer cache da mídia: $e');
      return ''; // Retorna vazio em caso de erro crítico
    }
  }

  /// Versão síncrona para obter o caminho (assume que já existe se for chamado no build)
  String getLocalFilePathSync(String url, String baseDir) {
    final fileName = p.basename(Uri.parse(url).path);
    return p.join(baseDir, 'media_cache', fileName);
  }

  /// Limpa cache antigo que não está na playlist atual
  Future<void> cleanOldCache(List<String> activeUrls) async {
    try {
      final directory = await getApplicationDocumentsDirectory();
      final cacheDir = Directory(p.join(directory.path, 'media_cache'));
      
      if (!await cacheDir.exists()) return;

      final activeFiles = activeUrls.map((url) => p.basename(Uri.parse(url).path)).toSet();

      await for (final entity in cacheDir.list()) {
        if (entity is File) {
          final name = p.basename(entity.path);
          if (!activeFiles.contains(name)) {
            await entity.delete();
          }
        }
      }
    } catch (e) {
      print('Erro ao limpar cache: $e');
    }
  }
}
