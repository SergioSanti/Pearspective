export default function handler(req, res) {
  console.log('🔍 Teste de login chamado');
  console.log('📡 Método:', req.method);
  console.log('📡 Headers:', req.headers);
  console.log('📡 Body:', req.body);
  
  if (req.method === 'POST') {
    const { usuario, senha } = req.body;
    
    console.log('🔐 Credenciais recebidas:', { usuario, senha });
    
    // Teste simples
    if (usuario === 'admin' && senha === 'Admin123') {
      console.log('✅ Login admin bem-sucedido');
      return res.json({
        success: true,
        id: 1,
        nome: 'admin',
        tipo_usuario: 'admin',
        foto_perfil: null,
        message: 'Login funcionando!'
      });
    } else {
      console.log('❌ Credenciais inválidas:', { usuario, senha });
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciais inválidas',
        received: { usuario, senha }
      });
    }
  }
  
  return res.json({ 
    message: 'Endpoint de teste funcionando',
    method: req.method,
    timestamp: new Date().toISOString()
  });
} 