# =====================================================================
# Gera os arquivos de uma conquista a partir de UMA arte pixel art 64x64.
#
#   powershell -ExecutionPolicy Bypass -File scripts/gerar-sprite-conquista.ps1 `
#     -Origem "C:\caminho\minha-arte.png" -Nome "minha-arte"
#
# Escreve em assets/achievements/ (64 pt, três densidades cada):
#   <nome>.png, <nome>@2x.png, <nome>@3x.png                   -> a arte
#   <nome>-bloqueada.png, <nome>-bloqueada@2x.png, ...@3x.png  -> a silhueta
#
# A silhueta é a própria arte apagada: sem cor, em três tons baixos entre o
# grafite e o cinza da marca (a arte pode ter fundo opaco, então recortar pela
# transparência não serve). A lista mostra que ali existe algo, sem revelar o
# quê. Para usar uma silhueta desenhada à mão, é só substituir os três arquivos
# -bloqueada.
#
# Por quê: o iOS amplia imagens com filtro linear, e pixel art ampliada assim
# fica borrada. Aqui a ampliação é feita uma vez, por vizinho-mais-próximo, e o
# Metro escolhe o arquivo da densidade do aparelho: cada pixel da arte cai
# inteiro na tela, sem nenhuma ampliação em tempo de execução.
#
# A origem pode ser o próprio <nome>.png: ela é lida para a memória antes de
# qualquer gravação.
#
# Só usa System.Drawing (vem com o Windows). Nenhuma dependência nova.
# =====================================================================
param(
  [Parameter(Mandatory = $true)] [string] $Origem,
  [Parameter(Mandatory = $true)] [string] $Nome
)

Add-Type -AssemblyName System.Drawing

$destino = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\assets\achievements'))
New-Item -ItemType Directory -Force $destino | Out-Null

# O grafite e o cinza da marca (MARCA.grafite #26252C, MARCA.cinza #9BADB7).
$grafite = [System.Drawing.Color]::FromArgb(0x26, 0x25, 0x2C)
$cinza = [System.Drawing.Color]::FromArgb(0x9B, 0xAD, 0xB7)

function Salvar-Densidades([System.Drawing.Image] $imagem, [string] $nomeDoArquivo) {
  foreach ($densidade in 1, 2, 3) {
    $lado = 64 * $densidade
    $bmp = New-Object System.Drawing.Bitmap $lado, $lado, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    # Half: sem isto a primeira linha e a primeira coluna saem com meio pixel.
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
    $g.DrawImage($imagem, 0, 0, $lado, $lado)
    $g.Dispose()

    $escala = if ($densidade -eq 1) { '' } else { "@${densidade}x" }
    $bmp.Save((Join-Path $destino "$nomeDoArquivo$escala.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "$nomeDoArquivo$escala.png  ${lado}x${lado}"
  }
}

# Para a memória primeiro: assim a origem pode ser o próprio arquivo base.
$fluxo = New-Object System.IO.MemoryStream(, [System.IO.File]::ReadAllBytes((Resolve-Path $Origem).Path))
$arte = New-Object System.Drawing.Bitmap ([System.Drawing.Image]::FromStream($fluxo))
try {
  if ($arte.Width -ne 64 -or $arte.Height -ne 64) {
    throw "A arte precisa ter 64x64 px (tem $($arte.Width)x$($arte.Height))."
  }

  Salvar-Densidades $arte $Nome

  # Mesma forma, sem cor: a luz de cada pixel cai em um de TRÊS tons entre o
  # grafite e o cinza da marca, com pouco contraste. Dá para ver que existe
  # algo ali; não dá para ver o quê. A transparência da arte passa como está.
  $silhueta = New-Object System.Drawing.Bitmap 64, 64, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  for ($y = 0; $y -lt 64; $y++) {
    for ($x = 0; $x -lt 64; $x++) {
      $p = $arte.GetPixel($x, $y)
      $luz = (0.299 * $p.R + 0.587 * $p.G + 0.114 * $p.B) / 255
      $tom = [math]::Min(2, [math]::Floor($luz * 3))
      $t = 0.12 + $tom * 0.14
      $r = [int][math]::Round($grafite.R + ($cinza.R - $grafite.R) * $t)
      $g = [int][math]::Round($grafite.G + ($cinza.G - $grafite.G) * $t)
      $b = [int][math]::Round($grafite.B + ($cinza.B - $grafite.B) * $t)
      $silhueta.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($p.A, $r, $g, $b))
    }
  }
  Salvar-Densidades $silhueta "$Nome-bloqueada"
  $silhueta.Dispose()
}
finally {
  $arte.Dispose()
  $fluxo.Dispose()
}
