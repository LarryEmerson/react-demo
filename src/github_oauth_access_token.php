<?php 
header("Access-Control-Allow-Origin: *");
 

$client_id = $_REQUEST['client_id'];
$client_secret = $_REQUEST['client_secret'];	
$code = $_REQUEST['code'];

$url="https://github.com/login/oauth/access_token?client_id=".$client_id."&client_secret=".$client_secret."&code=".$code;
$content = file_get_contents($url);
$result['url']=$url;
$result['client_id']=$client_id;
$result['client_secret']=$client_secret;
$result['code']=$code;
$result['content']=$content;
echo json_encode($result);
?>