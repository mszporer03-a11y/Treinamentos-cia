param(
    [string]$JsonPath  = (Join-Path $PSScriptRoot "..\prisma\franchisee-credentials.json"),
    [string]$OutputDir = "$env:USERPROFILE\Downloads"
)
$ErrorActionPreference = "Stop"

$creds = Get-Content $JsonPath -Encoding UTF8 | ConvertFrom-Json
if (-not $creds) { throw "JSON vazio em $JsonPath" }

$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
    $doc = $word.Documents.Add()
    $sel = $word.Selection

    $sel.ParagraphFormat.Alignment = 1
    $sel.Font.Name  = "Calibri"
    $sel.Font.Size  = 22
    $sel.Font.Bold  = $true
    $sel.Font.Color = 2040350  # navy
    $sel.TypeText("Portal de Treinamentos")
    $sel.TypeParagraph()
    $sel.Font.Size  = 14
    $sel.Font.Bold  = $false
    $sel.Font.Color = 4210752
    $sel.TypeText("Companhia do Churrasco - Credenciais dos Franqueados")
    $sel.TypeParagraph()
    $sel.Font.Size  = 10
    $sel.Font.Color = 8421504
    $date = Get-Date -Format "dd/MM/yyyy HH:mm"
    $sel.TypeText("Gerado em: $date")
    $sel.TypeParagraph()
    $sel.TypeParagraph()
    $sel.ParagraphFormat.Alignment = 0

    $i = 1
    foreach ($c in $creds) {
        $sel.Font.Name  = "Calibri"
        $sel.Font.Size  = 13
        $sel.Font.Bold  = $true
        $sel.Font.Color = 2040350
        $sel.TypeText("$i.  $($c.name)")
        $sel.Font.Bold  = $false
        $sel.TypeParagraph()

        $sel.Font.Size  = 11
        $sel.Font.Color = 0
        $sel.Font.Bold  = $true;  $sel.TypeText("E-mail / login:  ")
        $sel.Font.Bold  = $false; $sel.TypeText($c.email)
        $sel.TypeParagraph()

        $sel.Font.Bold  = $true;  $sel.TypeText("Senha:           ")
        $sel.Font.Bold  = $false
        $sel.Font.Size  = 14
        $sel.Font.Color = 9109504   # dark red
        $sel.TypeText($c.password)
        $sel.Font.Color = 0
        $sel.Font.Size  = 11
        $sel.TypeParagraph()

        $sel.Font.Bold  = $true;  $sel.TypeText("Lojas:")
        $sel.Font.Bold  = $false
        $sel.TypeParagraph()
        foreach ($loja in $c.stores) {
            $sel.TypeText("     - $loja")
            $sel.TypeParagraph()
        }
        $sel.TypeParagraph()
        $i++
    }

    $sel.ParagraphFormat.Alignment = 1
    $sel.Font.Size    = 9
    $sel.Font.Italic  = $true
    $sel.Font.Color   = 255
    $sel.TypeText("DOCUMENTO CONFIDENCIAL - Nao distribua nem compartilhe.")
    $sel.Font.Italic  = $false

    $outputFile = Join-Path $OutputDir ("Franqueados-Credenciais-" + (Get-Date -Format "yyyyMMdd") + ".docx")
    $outputFileStr = [string]$outputFile
    $saveFormat = [int]16
    $doc.SaveAs2($outputFileStr, $saveFormat)
    $doc.Close()
    Write-Host "OK: $outputFile"
} finally {
    $word.Quit()
}
