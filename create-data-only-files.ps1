# Script para criar arquivos que só inserem dados (sem criar tabelas)
# Para usar quando as tabelas já existem no Supabase

param(
    [string]$InputDir = "dump-supabase",
    [string]$OutputDir = "dump-data-only"
)

# Criar diretório de saída se não existir
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir
}

Write-Host "Criando arquivos que só inserem dados..."
Write-Host "Arquivos de entrada: $InputDir"
Write-Host "Arquivos de saída: $OutputDir"

# Processar cada arquivo
Get-ChildItem -Path $InputDir -Filter "*.sql" | ForEach-Object {
    $inputFile = $_.FullName
    $outputFile = Join-Path $OutputDir $_.Name
    
    Write-Host "Processando: $($_.Name)"
    
    # Ler o conteúdo do arquivo
    $content = Get-Content $inputFile -Raw
    
    # Para arquivos de estrutura (01-structure.sql), criar versão que só cria sequências
    if ($_.Name -eq "01-structure.sql") {
        # Extrair apenas as sequências e configurações
        $lines = $content -split "`n"
        $dataOnlyLines = @()
        
        foreach ($line in $lines) {
            # Incluir configurações iniciais
            if ($line -match "^SET " -or $line -match "^SELECT " -or $line -match "^--") {
                $dataOnlyLines += $line
            }
            # Incluir apenas sequências (não tabelas)
            elseif ($line -match "CREATE SEQUENCE" -or $line -match "ALTER SEQUENCE" -or $line -match "OWNED BY") {
                $dataOnlyLines += $line
            }
            # Incluir configurações de sequências
            elseif ($line -match "setval") {
                $dataOnlyLines += $line
            }
        }
        
        $cleanContent = $dataOnlyLines -join "`n"
    }
    # Para outros arquivos, manter como estão (já são só dados)
    else {
        $cleanContent = $content
    }
    
    # Salvar o arquivo
    $cleanContent | Out-File -FilePath $outputFile -Encoding UTF8
    
    Write-Host "  ✅ Criado: $($_.Name)"
}

Write-Host "`nProcessamento concluído!"
Write-Host "Arquivos de dados criados em: $OutputDir"
Write-Host "`nUse estes arquivos se as tabelas já existem no Supabase" 