document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const usuario = document.getElementById("usuario").value;
    const senha = document.getElementById("senha").value;

    // Simulação de verificação
    if (usuario === "admin" && senha === "1234") {
      window.location.href = "Page_inicial/index.html";
    } else {
      alert("Usuário ou senha incorretos.");
    }
  });
});
