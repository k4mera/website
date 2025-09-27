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