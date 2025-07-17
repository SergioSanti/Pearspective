# Script para converter comandos COPY para INSERT
# Para melhor compatibilidade com o Supabase

param(
    [string]$InputDir = "dump-supabase",
    [string]$OutputDir = "dump-insert"
)

# Criar diretório de saída se não existir
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir
}

Write-Host "Convertendo comandos COPY para INSERT..."
Write-Host "Arquivos de entrada: $InputDir"
Write-Host "Arquivos de saída: $OutputDir"

# Processar cada arquivo
Get-ChildItem -Path $InputDir -Filter "*.sql" | ForEach-Object {
    $inputFile = $_.FullName
    $outputFile = Join-Path $OutputDir $_.Name
    
    Write-Host "Processando: $($_.Name)"
    
    # Ler o conteúdo do arquivo
    $content = Get-Content $inputFile -Raw
    
    # Se o arquivo contém comandos COPY, converter para INSERT
    if ($content -match "COPY public\.") {
        $lines = $content -split "`n"
        $insertLines = @()
        $inCopyBlock = $false
        $tableName = ""
        $columns = @()
        
        foreach ($line in $lines) {
            # Detectar início do comando COPY
            if ($line -match "COPY public\.(\w+) \((.*?)\) FROM stdin;") {
                $tableName = $matches[1]
                $columns = $matches[2] -split ", " | ForEach-Object { $_.Trim() }
                $inCopyBlock = $true
                $insertLines += "-- Convertido de COPY para INSERT"
                $insertLines += "-- Tabela: $tableName"
                $insertLines += ""
                continue
            }
            
            # Detectar fim do comando COPY
            if ($line -match "^\\\.$") {
                $inCopyBlock = $false
                $insertLines += ""
                continue
            }
            
            # Processar dados dentro do bloco COPY
            if ($inCopyBlock -and $line.Trim() -ne "") {
                $values = $line -split "`t"
                
                # Processar valores especiais
                $processedValues = @()
                for ($i = 0; $i -lt $values.Length; $i++) {
                    $value = $values[$i].Trim()
                    
                    if ($value -eq "\N") {
                        $processedValues += "NULL"
                    }
                    elseif ($value -match "^\d+$") {
                        $processedValues += $value
                    }
                    elseif ($value -match "^\d+\.\d+$") {
                        $processedValues += $value
                    }
                    elseif ($value -match "^\d{4}-\d{2}-\d{2}") {
                        $processedValues += "'$value'"
                    }
                    elseif ($value -match "^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}") {
                        $processedValues += "'$value'"
                    }
                    elseif ($value -match "^\{.*\}$") {
                        # JSON - manter como está
                        $processedValues += "'$value'"
                    }
                    elseif ($value -match "^\{.*\}$") {
                        # Array - manter como está
                        $processedValues += "'$value'"
                    }
                    else {
                        # String - escapar aspas e adicionar aspas
                        $escapedValue = $value -replace "'", "''"
                        $processedValues += "'$escapedValue'"
                    }
                }
                
                $insertStatement = "INSERT INTO public.$tableName ($($columns -join ', ')) VALUES ($($processedValues -join ', '));"
                $insertLines += $insertStatement
            }
            # Manter linhas fora do bloco COPY
            elseif (-not $inCopyBlock) {
                $insertLines += $line
            }
        }
        
        $cleanContent = $insertLines -join "`n"
    }
    else {
        # Se não tem COPY, manter como está
        $cleanContent = $content
    }
    
    # Salvar o arquivo
    $cleanContent | Out-File -FilePath $outputFile -Encoding UTF8
    
    Write-Host "  ✅ Criado: $($_.Name)"
}

Write-Host "`nConversão concluída!"
Write-Host "Arquivos convertidos criados em: $OutputDir"
Write-Host "`nUse estes arquivos no Supabase - eles usam INSERT em vez de COPY" 