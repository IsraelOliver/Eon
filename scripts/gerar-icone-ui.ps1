# =====================================================================
# Gera os arquivos de um micro-ícone da interface a partir de UMA arte pixel
# art, de qualquer tamanho.
#
#   powershell -ExecutionPolicy Bypass -File scripts/gerar-icone-ui.ps1 `
#     -Origem "C:\caminho\meu-icone.png" -Nome "meu-icone" -Escala3x 4
#
# -Escala3x: quantos px de tela cada pixel da arte ocupa no iPhone 3x. Tem de
# bater com a caixa onde ele aparece: arte de N px numa caixa de S pt => S*3 = N*Escala3x.
#
# Escreve em assets/ui/:  <nome>.png, <nome>@2x.png, <nome>@3x.png
# A origem pode ser o próprio <nome>.png de assets/ui: ele é lido para a memória
# antes de qualquer gravação, e o base só é copiado quando a origem é outra.
#
# Hoje:
# - Letter_Discovery, 14x14, numa caixa de 56/3 pt (~18,7 pt) —
#   `TAMANHO_DO_SPRITE`, na ActionBar — com `contain` (-Escala3x 4). Nas telas
#   3x dá EXATAMENTE 4 px de tela por pixel da arte. Nas telas 2x (iPhone 11,
#   XR, SE) são 2,67 px: não existe múltiplo inteiro, então a versão @2x é feita
#   por vizinho-mais-próximo — nítida, com colunas levemente desiguais.
# - gear_configuration, 22x22, numa caixa de 22 pt no TopBar (-Escala3x 3):
#   blocos exatos de 2x2 e 3x3 nas duas densidades.
#
# O arquivo base (1x) é a arte ORIGINAL, intacta: nenhum iPhone é 1x, mas a web
# (que não escolhe densidade) usa justamente este.
#
# Só usa System.Drawing (vem com o Windows). Nenhuma dependência nova.
# =====================================================================
param(
  [Parameter(Mandatory = $true)] [string] $Origem,
  [Parameter(Mandatory = $true)] [string] $Nome,
  [int] $Escala3x = 2
)

Add-Type -AssemblyName System.Drawing

$destino = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\assets\ui'))
New-Item -ItemType Directory -Force $destino | Out-Null
$origemCompleta = (Resolve-Path $Origem).Path
$base = Join-Path $destino "$Nome.png"

# Para a memória primeiro: assim a origem pode ser o próprio arquivo base.
$fluxo = New-Object System.IO.MemoryStream(, [System.IO.File]::ReadAllBytes($origemCompleta))
$arte = [System.Drawing.Image]::FromStream($fluxo)
try {
  # O base é a arte intacta: copiada byte a byte, sem recodificar.
  if ($origemCompleta -ne $base) { Copy-Item $origemCompleta $base -Force }
  Write-Output "$Nome.png  $($arte.Width)x$($arte.Height)  (arte original)"

  # (sufixo, escala): 3x = Escala3x px por pixel da arte; 2x = 2/3 disso, arredondado.
  foreach ($variante in @(@('@2x', ($Escala3x * 2 / 3)), @('@3x', $Escala3x))) {
    $largura = [int][math]::Round($arte.Width * $variante[1])
    $altura = [int][math]::Round($arte.Height * $variante[1])
    $bmp = New-Object System.Drawing.Bitmap $largura, $altura, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    # SourceCopy: a transparência da arte passa como está, sem misturar com fundo.
    $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $g.DrawImage($arte, 0, 0, $largura, $altura)
    $g.Dispose()

    $bmp.Save((Join-Path $destino "$Nome$($variante[0]).png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "$Nome$($variante[0]).png  ${largura}x${altura}"
  }
}
finally {
  $arte.Dispose()
  $fluxo.Dispose()
}
