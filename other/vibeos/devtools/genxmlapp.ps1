# Script to generate AppXML file
# Written by ctaetcsh
# Last modified: 2021-05-17

$name = Read-Host -Prompt 'Enter App Name'
$sizewidth = Read-Host -Prompt 'Enter App Window Width'
$sizeheight = Read-Host -Prompt 'Enter App Window Height'
$iconpath = Read-Host -Prompt 'Enter basefs Path to Icon'
$filename = Read-Host -Prompt 'Enter basefs filename (NO EXTENSION)'
$bfsfilepath = "../basefs/var/xml/$filename.xml"

New-Item -Path "../basefs/var/xml/" -Name "$filename.xml" -ItemType "file"

# If user does not add px when inputting height/width, this will do it for them
if ($sizewidth -notlike "*px") {
    $sizewidth = $sizewidth + "px"
}
if ($sizeheight -notlike "*px") {
    $sizeheight = $sizeheight + "px"
}


"<?xml version='1.0' encoding='utf8'?>

<app>
	<meta>
		<title>$name</title>
		<icon src='$iconpath'></icon>
		<position x='ui.align.middle' y='ui.align.middle'></position>
		<size width='$sizewidth' height='$sizeheight'></size>
	</meta>
	<content>
		
	</content>
</app>" | Out-File -FilePath $bfsfilepath

Write-Host "File created! Go to $bfsfilepath"