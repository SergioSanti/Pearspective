# Script para criar versões limpas dos arquivos de dump para Supabase
# Remove referências ao usuário 'admin' e usa 'postgres' (padrão do Supabase)

param(
    [string]$InputDir = "dump-parts",
    [string]$OutputDir = "dump-supabase"
)

# Criar diretório de saída se não existir
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir
}

Write-Host "Criando versões limpas dos arquivos para Supabase..."
Write-Host "Arquivos de entrada: $InputDir"
Write-Host "Arquivos de saída: $OutputDir"

# Processar cada arquivo
Get-ChildItem -Path $InputDir -Filter "*.sql" | ForEach-Object {
    $inputFile = $_.FullName
    $outputFile = Join-Path $OutputDir $_.Name
    
    Write-Host "Processando: $($_.Name)"
    
    # Ler o conteúdo do arquivo
    $content = Get-Content $inputFile -Raw
    
    # Substituir referências ao usuário 'admin' por 'postgres'
    $cleanContent = $content -replace "OWNER TO admin", "OWNER TO postgres"
    $cleanContent = $cleanContent -replace "ALTER TABLE public\.", "ALTER TABLE IF EXISTS public."
    $cleanContent = $cleanContent -replace "ALTER SEQUENCE public\.", "ALTER SEQUENCE IF EXISTS public."
    
    # Salvar o arquivo limpo
    $cleanContent | Out-File -FilePath $outputFile -Encoding UTF8
    
    Write-Host "  ✅ Criado: $($_.Name)"
}

Write-Host "`nProcessamento concluído!"
Write-Host "Arquivos limpos criados em: $OutputDir"
Write-Host "`nAgora você pode importar os arquivos da pasta '$OutputDir' no Supabase" 