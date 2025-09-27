async function requestDeviceOrientation() {

  if(typeof DeviceOrientationEvent != 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function'){

    try{
      const permissionState = await DeviceOrientationEvent.requestPermission()
      if(permissionState === 'granted'){
        window.addEventListener('deviceorientation', handleOrientation)
      }
    }catch(error){
      console.error(error)
    }
  }else if('DeviceOrientationEvent' in window){
    window.addEventListener('deviceorientation', handleOrientation)
  }else{
    alert('not supported')
  }
}
function handleDoubleClick(event){

  var section = event.currentTarget;

  if (!event.target.closest('.ig_post_content')) {
    return
  }

  var postAction = section.querySelector('.ig_post_action');
  if (postAction) {
    var heartIcon = postAction.querySelector('.fa-heart-o');
    if (heartIcon) {
      heartIcon.classList.remove('fa-heart-o');
      heartIcon.classList.add('fa-heart');
    }
  }

  var icon = section.querySelector("i")
  icon.style.transform = "translate(-50%,50%) scale(1)";
  icon.style.opacity = 0.8;
  icon.style.color = "red";
  setTimeout(function () {
    icon.style.opacity = 0;
  }, 1000);

  setTimeout(function () {
    icon.style.transform = "translate(-50%,50%) scale(0)";
  }, 1000);

  
}

function like(icon) {
  var liked = icon.classList.contains('fa-heart')
  if (liked) {
    icon.classList.remove('fa-heart');
    icon.classList.add('fa-heart-o');
  } else {
    icon.classList.remove('fa-heart-o');
    icon.classList.add('fa-heart');
  }
}