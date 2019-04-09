<?php

function __autoload($class_name) {
    require '../php-sdk/src/' . str_replace('\\','/',$class_name) . '.php';
}

use Facebook\FacebookSession;
use Facebook\FacebookRequest;
use Facebook\GraphUser;
use Facebook\FacebookRequestException;
use Facebook\FacebookJavaScriptLoginHelper;

/* TODO: Application and secret redacted /*
FacebookSession::setDefaultApplication("xxxxxxx","xxxxxx");

$helper = new FacebookJavaScriptLoginHelper();
try {
  $session = $helper->getSession();
} catch(FacebookRequestException $e) {
  echo "Exception occured, code: " . $e->getCode();
    echo " with message: " . $e->getMessage();
} catch(\Exception $ex) {
  echo 'Validation fail';
}
echo "Session: " . ($session ? 'ok' : 'false')."\n";
if($session && isset($_POST['img'])){
	$img=$_POST['img'];
	$needle="base64,";
	$img=substr($img, strpos($img, $needle)+strlen($needle));
	$img=base64_decode($img,false);
	$name=tempnam("upload", "img");
	file_put_contents($name, $img);
  try{
    $request =  new FacebookRequest($session, 'POST', '/me/photos', array(
      'message' => "Created using http://bikinibubble.com/",
      'source' => "@".$name
    ));
    $response = $request->execute();
  }catch(FacebookRequestException $e){
    echo "Exception occured when posting, code: " . $e->getCode();
    echo " with message: " . $e->getMessage();
  }
	sleep(2);
	unlink($name);
}
