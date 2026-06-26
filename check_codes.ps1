$codes = @(
    'TX20212345678','TXnews1234567','VD1T1w2K4x6O8','TXa1b2c3d4e5f',
    'TXf6g7h8i9j0k','TXm1n2o3p4q5r','TXs6t7u8v9w0x','TXy1z2a3b4c5d',
    'VDe5f6g7h8i9j','VDx0y1z2a3b4c','TXp0q1r2s3t4u','TXp5q6r7s8t9u0'
)
foreach ($c in $codes) {
    $suffix = $c.Substring(2)
    $ok = $suffix -match '^[A-Za-z0-9]{11}$'
    Write-Host "  $c  len=$($c.Length)  suffix=$suffix  ok=$ok"
}
