<?php
// Copy to a PRIVATE directory outside public_html. Never commit actual secrets.
return [
 'dsn' => 'mysql:host=localhost;port=3306;dbname=YOUR_DATABASE;charset=utf8mb4',
 'user' => 'YOUR_DATABASE_USER',
 'password' => 'YOUR_DATABASE_PASSWORD',
 'origins' => ['https://localhost', 'capacitor://localhost'],
 'rate_secret' => 'REPLACE_WITH_64_RANDOM_HEX_CHARACTERS',
 'require_https' => true,
];
