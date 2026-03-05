import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../main.dart';

class SetupScreen extends StatefulWidget {
  const SetupScreen({super.key});

  @override
  State<SetupScreen> createState() => _SetupScreenState();
}

class _SetupScreenState extends State<SetupScreen> {
  final TextEditingController _ipController = TextEditingController();
  final TextEditingController _codeController = TextEditingController();
  bool _isConnecting = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadSavedIp();
  }

  Future<void> _loadSavedIp() async {
    final prefs = await SharedPreferences.getInstance();
    final savedIp = prefs.getString('supabase_ip');
    if (savedIp != null) {
      _ipController.text = savedIp;
    }
  }

  Future<void> _connect() async {
    final ip = _ipController.text.trim();
    final code = _codeController.text.trim().toUpperCase();
    
    if (ip.isEmpty || code.isEmpty) {
      setState(() => _errorMessage = 'Preencha o IP e o Código de Pareamento.');
      return;
    }

    setState(() {
      _isConnecting = true;
      _errorMessage = null;
    });

    try {
      // Endereço especial para o emulador se for localhost
      String finalIp = ip;
      if (ip == 'localhost' || ip == '127.0.0.1') {
        finalIp = '10.0.2.2';
      }
      
      final supabaseUrl = 'http://$finalIp:8000';
      const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzcyMjA5MDU5LCJleHAiOjIwODc1NjkwNTl9.qyhQsZ2rz5msSiFEdB--fJuZLealq6Soaoop6GA2jlg';

      // Verificar se o Supabase já está inicializado
      // Se estiver, precisamos lidar com o fato de que ele não pode ser re-inicializado facilmente
      // A solução mais simples é pedir para o usuário reiniciar o app se o IP mudar drasticamente
      // Mas para a primeira configuração, inicializamos.
      
      try {
        await Supabase.initialize(url: supabaseUrl, anonKey: anonKey);
      } catch (e) {
        // Se já estiver inicializado, apenas continuamos usando a instância existente
        // Se o URL for diferente, o Supabase infelizmente não troca o client em tempo de execução
        // Vamos logar o erro e tentar usar o que está lá.
        print('Supabase já inicializado ou erro: $e');
      }

      final client = Supabase.instance.client;
      
      // Tentar buscar a TV com um timeout curto para não travar
      final response = await client
          .from('tvs')
          .select('id')
          .eq('pairing_code', code)
          .maybeSingle()
          .timeout(const Duration(seconds: 10));

      if (response == null) {
        setState(() => _errorMessage = 'Código de pareamento não encontrado.');
        return;
      }

      final tvId = response['id'];

      // Salvar IP e ID da TV
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('supabase_ip', finalIp);
      await prefs.setString('tv_id', tvId);

      if (!mounted) return;
      
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => const TVPlayerScreen()),
        (route) => false,
      );
    } catch (e) {
      print('Erro no setup: $e');
      setState(() {
        _errorMessage = 'Erro ao conectar: Verifique o IP e a conexão com o servidor. Se mudar de IP, reinicie o app.';
      });
    } finally {
      setState(() {
        _isConnecting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 500),
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: Colors.grey[900],
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.blue.withOpacity(0.3)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.settings_remote, size: 64, color: Colors.blue),
              const SizedBox(height: 24),
              const Text(
                'Configuração de Rede',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(height: 8),
              const Text(
                'Digite o endereço IP do servidor ou 10.0.2.2 para o host do emulador.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
              const SizedBox(height: 32),
              TextField(
                controller: _ipController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Endereço IP (ex: 192.168.31.126)',
                  labelStyle: const TextStyle(color: Colors.grey),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.grey[700]!),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: const BorderSide(color: Colors.blue),
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                keyboardType: TextInputType.text, // Permitir localhost
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _codeController,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 4),
                textAlign: TextAlign.center,
                decoration: InputDecoration(
                  labelText: 'Código de Pareamento',
                  labelStyle: const TextStyle(color: Colors.grey, letterSpacing: 0),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.grey[700]!),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: const BorderSide(color: Colors.blue),
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                textCapitalization: TextCapitalization.characters,
              ),
              if (_errorMessage != null) ...[
                const SizedBox(height: 16),
                Text(
                  _errorMessage!,
                  style: const TextStyle(color: Colors.red, fontSize: 13),
                  textAlign: TextAlign.center,
                ),
              ],
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _isConnecting ? null : _connect,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: _isConnecting
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Conectar e Iniciar', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
