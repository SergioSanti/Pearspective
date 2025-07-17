document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value.trim();

    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usuario, senha })
      });

      const data = await response.json();
      console.log('[LOGIN] Resposta do servidor:', data);

      if (data.success && data.id) {
        // Salvar dados básicos no localStorage para compatibilidade
        localStorage.setItem('userName', data.nome);
        localStorage.setItem('userId', data.id);
        localStorage.setItem('tipo_usuario', data.tipo_usuario);
        
        // Salvar foto do perfil se disponível
        if (data.foto_perfil) {
          localStorage.setItem('userPhoto', data.foto_perfil);
        } else {
          localStorage.removeItem('userPhoto');
        }
        
        console.log('[LOGIN] Login bem-sucedido:', data.nome);
        console.log('[LOGIN] Session token:', data.sessionToken ? 'Presente' : 'Não presente');
        
        // Redireciona após salvar os dados
        window.location.href = 'Page_inicial/index.html';
      } else {
        alert(data.message || 'Erro no login');
      }
    } catch (error) {
      console.error('[LOGIN] Erro:', error);
      alert('Erro ao conectar com o servidor.');
    }
  });
});