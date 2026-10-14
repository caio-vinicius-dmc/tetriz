<?php
declare(strict_types=1);
function validate_record(array $r): array {
 if (!is_string($r['id'] ?? null) || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/D', $r['id'])) throw new InvalidArgumentException('id');
 foreach (['score','lines','level','duration','rules','avatar'] as $k) if (!isset($r[$k]) || !is_int($r[$k]) || $r[$k]<0) throw new InvalidArgumentException($k);
 if (!in_array($r['rules'],[1,10,12,13,14,15,16,17],true) || $r['avatar']>3 || $r['lines']>1000000 || $r['level']!==1+intdiv($r['lines'],10) || $r['score']>2000000000 || $r['duration']>31536000 || $r['lines']>($r['duration']+1)*4 || $r['score']>($r['duration']+1)*10000) throw new InvalidArgumentException('range');
 if (!is_string($r['name']??null) || !preg_match('/^[\p{L}\p{N} ._\-]{1,24}$/uD', $r['name'])) throw new InvalidArgumentException('name');
 $photo=null;
 if (!empty($r['photo'])) {
  if (!is_string($r['photo']) || strlen($r['photo'])>50000 || !str_starts_with($r['photo'],'data:image/jpeg;base64,')) throw new InvalidArgumentException('photo');
  $raw=base64_decode(substr($r['photo'],23),true);
  if ($raw===false) throw new InvalidArgumentException('photo');
  $info=@getimagesizefromstring($raw);
  if (!$info || $info[0]!==128 || $info[1]!==128 || $info[2]!==IMAGETYPE_JPEG) throw new InvalidArgumentException('photo');
  $image=@imagecreatefromstring($raw);if (!$image) throw new InvalidArgumentException('photo');
  ob_start();imagejpeg($image,null,80);$photo=ob_get_clean();imagedestroy($image);
 }
 return [...$r,'photo'=>$photo];
}
