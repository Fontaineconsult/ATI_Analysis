<#
.SYNOPSIS
    Generates a directory tree structure using ASCII characters, excluding specified folders.

.DESCRIPTION
    This script creates a text-based tree representation of a directory structure,
    excluding specified folders and limiting the depth of traversal. It includes both
    directories and files in the output.

.PARAMETER Path
    The root directory path from which to start generating the tree. Defaults to the current directory.

.PARAMETER Exclude
    An array of folder names to exclude from the tree.

.PARAMETER MaxDepth
    The maximum depth to traverse in the directory tree. Defaults to 4.

.PARAMETER OutputFile
    Optional. The file path to save the output. If not specified, outputs to the console.

.EXAMPLE
    .\Generate-DirectoryTree_ASCII.ps1 -Path "C:\Path\To\Your\Project" -Exclude @("venv", "__pycache__", "build") -MaxDepth 4 -OutputFile "C:\Path\To\Your\Project\project_structure.txt"

.NOTES
    - Ensure you have the necessary permissions to access the directories.
    - If running the script for the first time, you might need to adjust your PowerShell execution policy.
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$Path = ".",

    [Parameter(Mandatory=$false)]
    [string[]]$Exclude = @("venv", "__pycache__", "build"),

    [Parameter(Mandatory=$false)]
    [int]$MaxDepth = 4,

    [Parameter(Mandatory=$false)]
    [string]$OutputFile
)

function Show-DirectoryTree {
    param (
        [string]$Path = ".",
        [string[]]$Exclude = @("venv", "__pycache__", "build"),
        [int]$MaxDepth = 4,
        [int]$CurrentDepth = 0,
        [string]$Prefix = ""
    )

    # Stop recursion if max depth is reached
    if ($CurrentDepth -ge $MaxDepth) {
        return
    }

    # Retrieve directories excluding specified ones and ensure it's an array
    try {
        $directories = @(Get-ChildItem -Path $Path -Directory -ErrorAction Stop | Where-Object { $Exclude -notcontains $_.Name } | Sort-Object Name)
    } catch {
        Write-Error "Error accessing path '$Path'. $_"
        return
    }

    # Retrieve files and ensure it's an array
    try {
        $files = @(Get-ChildItem -Path $Path -File -ErrorAction Stop | Sort-Object Name)
    } catch {
        Write-Error "Error accessing files in path '$Path'. $_"
        return
    }

    # Combine directories and files into a single array
    $items = $directories + $files
    $count = $items.Count

    for ($i = 0; $i -lt $count; $i++) {
        $item = $items[$i]
        $isLast = ($i -eq ($count - 1))

        # Determine the connector based on whether it's the last item
        if ($isLast) {
            $connector = "+-- "
        } else {
            $connector = "|-- "
        }

        # Properly assign the item's name without quotes
        $itemName = $item.Name
        $line = "$Prefix$connector$itemName"
        Write-Output $line

        # Determine the new prefix for child items
        if ($isLast) {
            $newPrefix = $Prefix + "    "
        } else {
            $newPrefix = $Prefix + "|   "
        }

        # If the item is a directory, recurse into it
        if ($item.PSIsContainer) {
            Show-DirectoryTree -Path $item.FullName -Exclude $Exclude -MaxDepth $MaxDepth -CurrentDepth ($CurrentDepth + 1) -Prefix $newPrefix
        }
    }
}

# Resolve the root directory path and validate its existence
try {
    $resolvedPath = Resolve-Path $Path -ErrorAction Stop
} catch {
    Write-Error "The specified path '$Path' does not exist. $_"
    exit 1
}

# Extract the root directory name
$rootName = Split-Path -Leaf $resolvedPath
$treeOutput = @()
$treeOutput += $rootName

# Generate the tree structure
$childLines = Show-DirectoryTree -Path $resolvedPath -Exclude $Exclude -MaxDepth $MaxDepth
$treeOutput += $childLines

# Output the tree to a file or the console
if ($OutputFile) {
    try {
        # Write to the specified file with UTF8 encoding
        $treeOutput | Out-File -FilePath $OutputFile -Encoding UTF8 -Force
        Write-Host "Directory tree has been saved to '$OutputFile'" -ForegroundColor Green
    } catch {
        Write-Error "Failed to write to file '$OutputFile'. $_"
    }
} else {
    # Output to the console
    $treeOutput | ForEach-Object { Write-Host $_ }
}
