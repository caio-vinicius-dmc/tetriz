<?php
declare(strict_types=1);
ini_set('display_errors','0');
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
function respond(int $code,array $body): never {http_response_code($code);echo json_encode($body,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);exit;}
try {
 // Resolve the private sibling of public_html for root or /api deployments.
 $publicRoot=realpath($_SERVER['DOCUMENT_ROOT']??'') ?: __DIR__;
 $private=getenv('TETRIZ_PRIVATE_DIR') ?: dirname($publicRoot).'/tetriz-private';
 if (!is_file($private.'/config.php') || !is_file($private.'/validation.php')) respond(503,['error'=>'Serviço não configurado.']);
 $cfg=require $private.'/config.php';require $private.'/validation.php';
 if (($cfg['require_https']??true) && ($_SERVER['HTTPS']??'')!=='on') respond(400,['error'=>'HTTPS obrigatório.']);
 $origin=$_SERVER['HTTP_ORIGIN']??'';
 if ($origin!=='') {if (!in_array($origin,$cfg['origins'],true)) respond(403,['error'=>'Origem não permitida.']);header('Access-Control-Allow-Origin: '.$origin);header('Vary: Origin');}
 if ($_SERVER['REQUEST_METHOD']==='OPTIONS') {header('Access-Control-Allow-Methods: GET, POST, OPTIONS');header('Access-Control-Allow-Headers: Content-Type');http_response_code(204);exit;}
 if (strlen($cfg['rate_secret']??'')<64) respond(503,['error'=>'Serviço não configurado.']);
 $db=new PDO($cfg['dsn'],$cfg['user'],$cfg['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_EMULATE_PREPARES=>false]);
 $now=time();$bucket=hash_hmac('sha256',($_SERVER['REMOTE_ADDR']??'unknown').':'.intdiv($now,60),$cfg['rate_secret']);
 $q=$db->prepare('INSERT INTO tetriz_rate_limits (bucket,hits,expires_at) VALUES (?,1,?) ON DUPLICATE KEY UPDATE hits=hits+1');$q->execute([$bucket,$now+120]);
 $q=$db->prepare('SELECT hits FROM tetriz_rate_limits WHERE bucket=?');$q->execute([$bucket]);if ((int)$q->fetchColumn()>60){header('Retry-After: 60');respond(429,['error'=>'Limite de requisições.']);}
 $db->exec('DELETE FROM tetriz_rate_limits WHERE expires_at < '.(int)$now.' LIMIT 100');
 $route=$_GET['route']??'records';$method=$_SERVER['REQUEST_METHOD'];
 if ($route==='photo' && $method==='GET') {
  $id=$_GET['id']??'';if (!is_string($id)||strlen($id)!==36) respond(400,['error'=>'Identificador inválido.']);
  $q=$db->prepare('SELECT photo FROM tetriz_records WHERE id=?');$q->execute([$id]);$photo=$q->fetchColumn();if (!$photo) respond(404,['error'=>'Imagem não encontrada.']);header('Content-Type: image/jpeg');echo $photo;exit;
 }
 if ($route!=='records') respond(404,['error'=>'Rota inexistente.']);
 if ($method==='GET') {
  $page=filter_var($_GET['page']??1,FILTER_VALIDATE_INT,['options'=>['min_range'=>1,'max_range'=>1000]]);if ($page===false) respond(400,['error'=>'Página inválida.']);
  $rules=filter_var($_GET['rules']??1,FILTER_VALIDATE_INT);if(!in_array($rules,[1,10,12,13,14,15,16,17],true)) respond(400,['error'=>'Modo inválido.']);
  $q=$db->prepare('SELECT id,name,avatar,score,`lines`,level,duration,rules,created_at,photo IS NOT NULL AS has_photo FROM tetriz_records WHERE rules=? ORDER BY score DESC,created_at ASC,id ASC LIMIT 20 OFFSET ?');$q->bindValue(1,$rules,PDO::PARAM_INT);$q->bindValue(2,($page-1)*20,PDO::PARAM_INT);$q->execute();respond(200,['records'=>$q->fetchAll(PDO::FETCH_ASSOC),'page'=>$page,'rules'=>$rules]);
 }
 if ($method!=='POST'){header('Allow: GET, POST, OPTIONS');respond(405,['error'=>'Método não permitido.']);}
 if (!str_starts_with($_SERVER['CONTENT_TYPE']??'','application/json')) respond(415,['error'=>'Envie JSON.']);
 $raw=file_get_contents('php://input',false,null,0,65537);if (strlen($raw)>65536) respond(413,['error'=>'Requisição muito grande.']);
 try{$r=json_decode($raw,true,32,JSON_THROW_ON_ERROR);if (!is_array($r)) throw new InvalidArgumentException();$r=validate_record($r);}catch(JsonException|InvalidArgumentException $e){respond(422,['error'=>'Recorde inválido.']);}
 $q=$db->prepare('INSERT INTO tetriz_records (id,name,avatar,photo,score,`lines`,level,duration,rules) VALUES (?,?,?,?,?,?,?,?,?)');
 try{$q->execute([$r['id'],$r['name'],$r['avatar'],$r['photo'],$r['score'],$r['lines'],$r['level'],$r['duration'],$r['rules']]);}catch(PDOException $e){if ((int)($e->errorInfo[1]??0)===1062) respond(200,['status'=>'already_received']);throw $e;}
 respond(201,['status'=>'published']);
} catch (Throwable $e) {error_log('Tetriz API failure: '.get_class($e));respond(503,['error'=>'Serviço temporariamente indisponível.']);}
