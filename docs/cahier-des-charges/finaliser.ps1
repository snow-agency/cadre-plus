# Ouvre le .docx dans Microsoft Word, met à jour le sommaire et la pagination, enregistre,
# et (option) exporte un PDF. Usage : powershell -File finaliser.ps1 -Docx <chemin> [-Pdf <chemin>]
param(
  [Parameter(Mandatory = $true)][string]$Docx,
  [string]$Pdf
)
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  $doc = $word.Documents.Open((Resolve-Path $Docx).Path)
  $doc.Repaginate()
  foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
  $doc.Fields.Update() | Out-Null
  $doc.Save()
  if ($Pdf) { $doc.ExportAsFixedFormat($Pdf, 17) }
  Write-Output ("pages : " + $doc.ComputeStatistics(2))
  $doc.Close($false)
}
finally {
  $word.Quit()
}
