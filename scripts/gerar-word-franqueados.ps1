# gerar-word-franqueados.ps1
# Lê prisma/franchisee-credentials.json e gera um .docx formatado

param(
    [string]$JsonPath  = "$PSScriptRoot\..\prisma\franchisee-credentials.json",
    [string]$OutputDir = "$env:USERPROFILE\Downloads"
)

$ErrorActionPreference = "Stop"

$creds = Get-Content $JsonPath -Encoding UTF8 | ConvertFrom-Json
if (-not $creds) { throw "JSON vazio ou não encontrado em $JsonPath" }

$word = New-Object -ComObject Word.Application
$word.Visible = $false

try {
    $doc = $word.Documents.Add()
    $sel = $word.Selection

    # ── Título ────────────────────────────────────────────────────────────────
    $sel.ParagraphFormat.Alignment = 1  # wdAlignParagraphCenter
    $sel.Font.Name  = "Calibri"
    $sel.Font.Size  = 22
    $sel.Font.Bold  = $true
    $sel.Font.Color = 0x1F3864  # azul escuro
    $sel.TypeText("Portal de Treinamentos")
    $sel.TypeParagraph()

    $sel.Font.Size  = 14
    $sel.Font.Bold  = $false
    $sel.Font.Color = 0x404040
    $sel.TypeText("Companhia do Churrasco — Credenciais dos Franqueados")
    $sel.TypeParagraph()

    $sel.Font.Size  = 11
    $sel.Font.Color = 0x808080
    $sel.TypeText("Gerado em: $(Get-Date -Format 'dd/MM/yyyy HH:mm')")
    $sel.TypeParagraph()
    $sel.TypeParagraph()
    $sel.ParagraphFormat.Alignment = 0  # wdAlignParagraphLeft

    $i = 1
    foreach ($c in $creds) {

        # ── Separador / nome do franqueado ────────────────────────────────────
        $sel.Font.Name  = "Calibri"
        $sel.Font.Size  = 13
        $sel.Font.Bold  = $true
        $sel.Font.Color = 0x1F3864
        $sel.TypeText("$i.  $($c.name)")
        $sel.Font.Bold  = $false
        $sel.TypeParagraph()

        # linha horizontal simulada com underline em espaços
        $sel.Font.Size       = 6
        $sel.Font.Underline  = 1
        $sel.Font.Color      = 0xBBBBBB
        $sel.TypeText("    " * 80)
        $sel.Font.Underline  = 0
        $sel.TypeParagraph()

        # ── Campos ────────────────────────────────────────────────────────────
        $sel.Font.Size  = 11
        $sel.Font.Color = 0x000000

        $sel.Font.Bold  = $true;  $sel.TypeText("E-mail / login:  ")
        $sel.Font.Bold  = $false; $sel.TypeText($c.email)
        $sel.TypeParagraph()

        $sel.Font.Bold  = $true;  $sel.TypeText("Senha:           ")
        $sel.Font.Bold  = $false
        $sel.Font.Size  = 13
        # destaque vermelho só na senha
        $sel.Font.Color = 0x8B0000
        $sel.TypeText($c.password)
        $sel.Font.Color = 0x000000
        $sel.Font.Size  = 11
        $sel.TypeParagraph()

        # ── Lojas ─────────────────────────────────────────────────────────────
        $sel.Font.Bold  = $true;  $sel.TypeText("Lojas vinculadas:")
        $sel.Font.Bold  = $false
        $sel.TypeParagraph()

        foreach ($loja in $c.stores) {
            $sel.Font.Color = 0x1F497D
            $sel.TypeText("     • $loja")
            $sel.Font.Color = 0x000000
            $sel.TypeParagraph()
        }

        $sel.TypeParagraph()
        $i++
    }

    # ── Rodapé confidencial ───────────────────────────────────────────────────
    $sel.ParagraphFormat.Alignment = 1
    $sel.Font.Size    = 9
    $sel.Font.Italic  = $true
    $sel.Font.Color   = 0xFF0000
    $sel.TypeText("DOCUMENTO CONFIDENCIAL — Não distribua nem compartilhe electronicamente.")
    $sel.Font.Italic  = $false

    # ── Salvar ────────────────────────────────────────────────────────────────
    $outputFile = Join-Path $OutputDir "Franqueados-Credenciais-$(Get-Date -Format 'yyyyMMdd').docx"
    $doc.SaveAs([ref]$outputFile, [ref]16)   # 16 = wdFormatDocumentDefault (.docx)
    $doc.Close()

    Write-Host "✅ Documento salvo em: $outputFile"
    return $outputFile

} finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}
