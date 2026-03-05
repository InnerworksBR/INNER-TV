import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';

class TickerData {
  final String label;
  final String value;
  final bool isUp;

  TickerData(this.label, this.value, {this.isUp = true});
}

class TickerService extends ChangeNotifier {
  static final TickerService _instance = TickerService._internal();
  factory TickerService() => _instance;
  TickerService._internal();

  final Dio _dio = Dio();

  List<TickerData> _quotes = [];
  String _weather = "Carregando clima...";
  String _city = "São Paulo";
  
  List<TickerData> get quotes => _quotes;
  String get weather => _weather;
  String get city => _city;

  Timer? _refreshTimer;

  void setCity(String newCity) {
    if (_city != newCity) {
      _city = newCity;
      _fetchData();
    }
  }

  void startFetching() {
    _fetchData();
    _refreshTimer?.cancel();
    _refreshTimer = Timer.periodic(const Duration(minutes: 30), (_) => _fetchData());
  }

  void stopFetching() {
    _refreshTimer?.cancel();
  }

  Future<void> _fetchData() async {
    try {
      final response = await _dio.get(
        'https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL',
        options: Options(
          receiveTimeout: const Duration(seconds: 15),
          connectTimeout: const Duration(seconds: 15),
        ),
      );
      
      if (response.statusCode == 200) {
        final data = response.data;
        _quotes = [
          TickerData('DÓLAR', 'R\$ ${double.parse(data['USDBRL']['bid']).toStringAsFixed(2)}', isUp: double.parse(data['USDBRL']['pctChange']) >= 0),
          TickerData('EURO', 'R\$ ${double.parse(data['EURBRL']['bid']).toStringAsFixed(2)}', isUp: double.parse(data['EURBRL']['pctChange']) >= 0),
          TickerData('BITCOIN', 'R\$ ${double.parse(data['BTCBRL']['bid']).toStringAsFixed(0)}', isUp: double.parse(data['BTCBRL']['pctChange']) >= 0),
        ];
      }
    } on DioException catch (e) {
      print('Erro Dio ao buscar cotações (Sem Internet?): ${e.type}');
      // Fallback para modo DEMO/SIMULADO caso não haja internet no emulador
      _quotes = [
        TickerData('USD (SIMULADO)', 'R\$ 5,24', isUp: true),
        TickerData('EUR (SIMULADO)', 'R\$ 5,68', isUp: false),
        TickerData('BTC (SIMULADO)', 'R\$ 425.000', isUp: true),
      ];
    } catch (e) {
      print('Erro genérico: $e');
      _quotes = [TickerData('ERRO', 'REDE', isUp: false)];
    }

    try {
      _weather = "$_city: 24°C ☀️";
    } catch (e) {
      _weather = "Clima indisponível";
    }

    notifyListeners();
  }
}
