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

window.addEventListener('load', function() {
    document.getElementById('orientationPopup').style.display = 'block';
});

function handleOkClick() {
    requestDeviceOrientation();
    document.getElementById('orientationPopup').style.display = 'none';
}

const range = 50

function handleOrientation(e){

  let gamma = Math.min(Math.max(e.gamma + range/2, 0), range);



  var containers = document.querySelectorAll('.ig_post_content');
  var observer = new IntersectionObserver(function (entries, observer) {
    entries.forEach(function(entry) {
        if (entry.isIntersecting) {
            var container = entry.target
            var images = container.querySelectorAll('img');

            var length = images.length

            let index = Math.min(Math.floor(gamma/(range/length)), length-1);

            console.log(index)

            images.forEach(function(img) {
                img.style.display = 'none';
            });
            images[index].style.display = 'block';

            observer.unobserve(container);
        }
    })
  });

  containers.forEach(function (container) {
    observer.observe(container);
  });
}