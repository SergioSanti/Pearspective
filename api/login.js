export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { usuario, senha } = req.body;
  
  console.log('🔐 Tentativa de login:', { usuario, senha });
  
  // Login hardcoded para teste
  if (usuario === 'admin' && senha === 'Admin123') {
    console.log('✅ Login admin bem-sucedido');
    return res.json({
      success: true,
      id: 1,
      nome: 'admin',
      tipo_usuario: 'admin',
      foto_perfil: null
    });
  } else if (usuario === 'sergio' && senha === '12345') {
    console.log('✅ Login sergio bem-sucedido');
    return res.json({
      success: true,
      id: 2,
      nome: 'sergio',
      tipo_usuario: 'usuario',
      foto_perfil: null
    });
  } else {
    console.log('❌ Credenciais inválidas:', { usuario, senha });
    return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
  }
} 