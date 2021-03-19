//TOGGLER
function toggle(obj)
{
    var el = document.getElementById(obj);
    el.style.display = (el.style.display != 'none' ? 'none' : '' );
}

//MARKER
function markIt(obj)
{
    var marker = document.getElementById(obj);
    marker.style.color = (marker.style.color != '#000' ? '#000' : '' );
    marker.style.background = (marker.style.background != '#ffff00' ? '#ffff00' : '' );
    marker.style.opacity = (marker.style.opacity != '0.9' ? '0.9' : '' );
}