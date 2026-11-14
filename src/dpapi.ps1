$ErrorActionPreference = 'Stop'
$request = [Console]::In.ReadToEnd() | ConvertFrom-Json
[void][System.Reflection.Assembly]::Load('System.Security, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a')
$entropy = [System.Text.Encoding]::UTF8.GetBytes('guanlan-local-harness/provider-key/v1')
if ($request.mode -eq 'seal') {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($request.value)
    $result = [Convert]::ToBase64String([System.Security.Cryptography.ProtectedData]::Protect($bytes, $entropy, [System.Security.Cryptography.DataProtectionScope]::CurrentUser))
} elseif ($request.mode -eq 'open') {
    $bytes = [System.Security.Cryptography.ProtectedData]::Unprotect([Convert]::FromBase64String($request.value), $entropy, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
    $result = [System.Text.Encoding]::UTF8.GetString($bytes)
} else { throw 'Invalid operation' }
[Console]::Out.Write(($result | ConvertTo-Json -Compress))
